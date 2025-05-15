import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'kiss2fa.sqlite');

// Initialize database connection
let dbInstance = null;

export const getDb = async () => {
  if (dbInstance) return dbInstance;
  
  dbInstance = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
  
  // Initialize database schema if needed
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login_id TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT DEFAULT 'My Vault',
      logo TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS vaults (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      encrypted_data TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE TRIGGER IF NOT EXISTS update_user_timestamp
    AFTER UPDATE ON users
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
    
    CREATE TRIGGER IF NOT EXISTS update_vault_timestamp
    AFTER UPDATE ON vaults
    BEGIN
      UPDATE vaults SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);
  
  return dbInstance;
};

// Generate a random login ID (8 characters alphanumeric)
export const generateLoginId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Hash password for storage
export const hashPassword = (password) => {
  const salt = 'Kiss2FA-static-salt-for-consistent-hashing';
  return CryptoJS.SHA256(password + salt).toString();
};

// User management functions
export const createUser = async (password) => {
  const db = await getDb();
  const loginId = generateLoginId();
  const passwordHash = hashPassword(password);
  
  try {
    const result = await db.run(
      'INSERT INTO users (login_id, password_hash) VALUES (?, ?)',
      [loginId, passwordHash]
    );
    
    if (result.lastID) {
      // Create an empty vault for the user
      const emptyVaultData = encryptVaultData({
        entries: [],
        folders: []
      }, password);
      
      await db.run(
        'INSERT INTO vaults (user_id, encrypted_data) VALUES (?, ?)',
        [result.lastID, emptyVaultData]
      );
      
      return {
        success: true,
        userId: result.lastID,
        loginId
      };
    }
    
    return { success: false, error: 'Failed to create user' };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
};

export const authenticateUser = async (loginId, password) => {
  const db = await getDb();
  const passwordHash = hashPassword(password);
  
  try {
    const user = await db.get(
      'SELECT id, login_id, name, logo FROM users WHERE login_id = ? AND password_hash = ?',
      [loginId, passwordHash]
    );
    
    if (user) {
      return {
        success: true,
        user: {
          id: user.id,
          loginId: user.login_id,
          name: user.name,
          logo: user.logo
        }
      };
    }
    
    return { success: false, error: 'Invalid login credentials' };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (userId, updates) => {
  const db = await getDb();
  const { name, logo } = updates;
  
  try {
    const updateFields = [];
    const params = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      params.push(name);
    }
    
    if (logo !== undefined) {
      updateFields.push('logo = ?');
      params.push(logo);
    }
    
    if (updateFields.length === 0) {
      return { success: true, message: 'No updates provided' };
    }
    
    params.push(userId);
    
    const result = await db.run(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    return {
      success: true,
      changes: result.changes
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const db = await getDb();
  
  try {
    // First verify the current password
    const user = await db.get(
      'SELECT id FROM users WHERE id = ? AND password_hash = ?',
      [userId, hashPassword(currentPassword)]
    );
    
    if (!user) {
      return { success: false, error: 'Current password is incorrect' };
    }
    
    // Get the current vault data
    const vault = await db.get('SELECT encrypted_data FROM vaults WHERE user_id = ?', [userId]);
    if (!vault) {
      return { success: false, error: 'Vault not found' };
    }
    
    // Decrypt the vault with the current password
    let vaultData;
    try {
      vaultData = decryptVaultData(vault.encrypted_data, currentPassword);
    } catch (error) {
      return { success: false, error: 'Failed to decrypt vault with current password' };
    }
    
    // Re-encrypt the vault with the new password
    const newEncryptedData = encryptVaultData(vaultData, newPassword);
    
    // Update the password and re-encrypted vault in a transaction
    await db.run('BEGIN TRANSACTION');
    
    await db.run(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashPassword(newPassword), userId]
    );
    
    await db.run(
      'UPDATE vaults SET encrypted_data = ? WHERE user_id = ?',
      [newEncryptedData, userId]
    );
    
    await db.run('COMMIT');
    
    return { success: true };
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error changing password:', error);
    return { success: false, error: error.message };
  }
};

// Vault management functions
export const getVaultData = async (userId, password) => {
  const db = await getDb();
  
  try {
    const vault = await db.get('SELECT encrypted_data FROM vaults WHERE user_id = ?', [userId]);
    
    if (!vault) {
      return { success: false, error: 'Vault not found' };
    }
    
    try {
      const decryptedData = decryptVaultData(vault.encrypted_data, password);
      return {
        success: true,
        data: decryptedData
      };
    } catch (error) {
      return { success: false, error: 'Invalid password or corrupted data' };
    }
  } catch (error) {
    console.error('Error getting vault data:', error);
    return { success: false, error: error.message };
  }
};

export const saveVaultData = async (userId, vaultData, password) => {
  const db = await getDb();
  
  try {
    const encryptedData = encryptVaultData(vaultData, password);
    
    const result = await db.run(
      'UPDATE vaults SET encrypted_data = ? WHERE user_id = ?',
      [encryptedData, userId]
    );
    
    if (result.changes === 0) {
      // If no rows were updated, the vault might not exist yet
      await db.run(
        'INSERT INTO vaults (user_id, encrypted_data) VALUES (?, ?)',
        [userId, encryptedData]
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving vault data:', error);
    return { success: false, error: error.message };
  }
};

// Helper functions for encryption/decryption
export const encryptVaultData = (data, password) => {
  const jsonStr = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonStr, password).toString();
};

export const decryptVaultData = (encryptedData, password) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, password);
  const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decryptedStr);
};

export const deleteUserAccount = async (userId, password) => {
  const db = await getDb();
  
  try {
    // First verify the password
    const user = await db.get(
      'SELECT id FROM users WHERE id = ? AND password_hash = ?',
      [userId, hashPassword(password)]
    );
    
    if (!user) {
      return { success: false, error: 'Password is incorrect' };
    }
    
    // Delete the user and their vault (cascade will handle the vault deletion)
    const result = await db.run('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.changes > 0) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to delete account' };
    }
  } catch (error) {
    console.error('Error deleting user account:', error);
    return { success: false, error: error.message };
  }
};

// Export the database functions
export default {
  getDb,
  createUser,
  authenticateUser,
  updateUserProfile,
  changeUserPassword,
  getVaultData,
  saveVaultData,
  deleteUserAccount
};
