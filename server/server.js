import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import CryptoJS from 'crypto-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

// Import SQLite database functions
import {
  getDb,
  createUser,
  authenticateUser,
  updateUserProfile,
  changeUserPassword,
  getVaultData,
  saveVaultData,
  deleteUserAccount
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load runtime configuration
const configPath = path.join(__dirname, '../config.json');
if (!fs.existsSync(configPath)) {
  console.error('config.json not found at', configPath);
  process.exit(1);
}

const configRaw = fs.readFileSync(configPath, 'utf-8');
const config = JSON.parse(configRaw);
config.SERVER_PORT = Number(config.SERVER_PORT);

const app = express();
const PORT = config.SERVER_PORT;

// Protection system against multiple login attempts
const failedLoginAttempts = {};

// Function to reset the attempts counter after a certain time
const resetFailedAttemptsIfNeeded = (loginId) => {
  if (!failedLoginAttempts[loginId]) {
    failedLoginAttempts[loginId] = {
      count: 0,
      lastAttempt: Date.now(),
      MAX_ATTEMPTS: 5,
      RESET_TIME: 30 * 60 * 1000 // 30 minutes in milliseconds
    };
    return;
  }

  const now = Date.now();
  if (now - failedLoginAttempts[loginId].lastAttempt > failedLoginAttempts[loginId].RESET_TIME) {
    failedLoginAttempts[loginId].count = 0;
  }
  failedLoginAttempts[loginId].lastAttempt = now;
};

// Set strict routing to false (helps with path-to-regexp compatibility in ESM)
app.set('strict routing', false);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json({ limit: '5mb' })); // Increased limit for base64 images

// Session middleware
app.use(session({
  secret: uuidv4(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize database
getDb().then(() => {
  console.log('Database initialized successfully');
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const result = await createUser(password);

    if (result.success) {
      // Set session
      req.session.userId = result.userId;
      req.session.loginId = result.loginId;

      res.json({
        success: true,
        loginId: result.loginId
      });
    } else {
      res.status(500);
    }
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({ error: 'Login ID and password are required' });
    }

    // Check and reset failed attempts if needed
    resetFailedAttemptsIfNeeded(loginId);

    // Check if max attempts reached
    if (failedLoginAttempts[loginId] &&
      failedLoginAttempts[loginId].count >= failedLoginAttempts[loginId].MAX_ATTEMPTS) {
      return res.status(429).json({
        error: 'Too many failed login attempts. Please try again later.',
        attemptsLeft: 0,
        lockoutTime: failedLoginAttempts[loginId].RESET_TIME / 60000 // in minutes
      });
    }

    const result = await authenticateUser(loginId, password);

    if (result.success) {
      // Reset failed attempts counter
      if (failedLoginAttempts[loginId]) {
        failedLoginAttempts[loginId].count = 0;
      }

      // Set session
      req.session.userId = result.user.id;
      req.session.loginId = result.user.loginId;

      res.json({
        success: true,
        user: result.user
      });
    } else {
      // Increment failed attempts
      if (!failedLoginAttempts[loginId]) {
        resetFailedAttemptsIfNeeded(loginId);
      }
      failedLoginAttempts[loginId].count++;

      const attemptsLeft = failedLoginAttempts[loginId].MAX_ATTEMPTS - failedLoginAttempts[loginId].count;

      res.status(401).json({
        error: result.error || 'Invalid login credentials',
        attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0
      });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout user
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true });
  });
});

// Get current user profile
app.get('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get(
      'SELECT id, login_id, name, logo FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        loginId: user.login_id,
        name: user.name,
        logo: user.logo
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
app.put('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const { name, logo } = req.body;

    const result = await updateUserProfile(req.session.userId, { name, logo });

    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(500);
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
app.post('/api/user/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    const result = await changeUserPassword(req.session.userId, currentPassword, newPassword);

    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400);
    }
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user account
app.post('/api/user/delete-account', requireAuth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const result = await deleteUserAccount(req.session.userId, password);

    if (result.success) {
      // Destroy the session after successful account deletion
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session after account deletion:', err);
        }
        res.json({ success: true });
      });
    } else {
      res.status(400);
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if user is authenticated
app.get('/api/auth/status', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ authenticated: true, loginId: req.session.loginId });
  } else {
    res.json({ authenticated: false });
  }
});

// Get vault data (requires password for decryption)
app.post('/api/vault/data', requireAuth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    const result = await getVaultData(req.session.userId, password);

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(401);
    }
  } catch (error) {
    console.error('Error fetching vault data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save vault data (with encryption)
app.post('/api/vault/save', requireAuth, async (req, res) => {
  try {
    const { data, password } = req.body;
    if (!password || !data) {
      return res.status(400).json({ error: 'Password and data required' });
    }

    const result = await saveVaultData(req.session.userId, data, password);

    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(500);
    }
  } catch (error) {
    console.error('Error saving vault data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export vault (requires password for verification)
app.post('/api/vault/export', requireAuth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    const result = await getVaultData(req.session.userId, password);

    if (!result.success) {
      return res.status(401);
    }

    // Password is correct, prepare export data
    const exportData = {
      data: JSON.stringify(result.data),
      timestamp: new Date().toISOString(),
      format: 'kiss2fa-v2'
    };

    res.json(exportData);
  } catch (error) {
    console.error('Error exporting vault:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Import vault from exported data
app.post('/api/vault/import', requireAuth, async (req, res) => {
  try {
    const { importData, password } = req.body;
    if (!password || !importData || !importData.data) {
      return res.status(400).json({ error: 'Password and import data required' });
    }

    try {
      let vaultData;

      // Handle different import formats
      if (importData.format === 'kiss2fa-v2') {
        // New format - directly parse the JSON string
        vaultData = JSON.parse(importData.data);
      } else {
        // Old format - decrypt the data first
        const bytes = CryptoJS.AES.decrypt(importData.data, password);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        vaultData = JSON.parse(decryptedData);

        // Handle old format with separate folders
        if (importData.folders) {
          const folderBytes = CryptoJS.AES.decrypt(importData.folders, password);
          const decryptedFolders = folderBytes.toString(CryptoJS.enc.Utf8);
          const folders = JSON.parse(decryptedFolders);

          // Combine into new format
          vaultData = {
            entries: vaultData,
            folders: folders
          };
        } else {
          // Old format without folders
          vaultData = {
            entries: vaultData,
            folders: []
          };
        }
      }

      // Save the imported data to the user's vault
      const saveResult = await saveVaultData(req.session.userId, vaultData, password);

      if (saveResult.success) {
        res.json({ success: true });
      } else {
        res.status(500);
      }
    } catch (error) {
      console.error('Error processing import data:', error);
      res.status(401).json({ error: 'Invalid password or corrupted import data' });
    }
  } catch (error) {
    console.error('Error importing vault:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, '../dist')));

// All other requests go to the React app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Handle any other route patterns
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, config.SERVER_HOST, () => {
  console.log(`Server running on ${config.SERVER_URL}`);
});
