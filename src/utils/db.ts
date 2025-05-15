import CryptoJS from 'crypto-js';
import { TOTPEntry } from '../types';

const DB_NAME = 'xVaultDatabase';
const DB_VERSION = 1;
const STORE_NAME = 'totpEntries';

// Initialize the database
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject('Could not open database');
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Save encrypted entries to the database
export const saveEntries = async (entries: TOTPEntry[], password: string): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Clear existing data
    const clearRequest = store.clear();
    
    clearRequest.onsuccess = () => {
      // Encrypt full entries array
      const encrypted = encryptData(entries, password);
      
      // Save as a single record with a fixed ID
      const request = store.put({
        id: 'encryptedEntries',
        data: encrypted
      });
      
      request.onerror = (event) => {
        console.error('Error saving entries:', event);
      };
    };
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = (event) => {
        console.error('Transaction error:', event);
        reject('Failed to save entries');
      };
    });
  } catch (error) {
    console.error('Failed to save entries:', error);
    throw error;
  }
};

// Load and decrypt entries from the database
export const loadEntries = async (password: string): Promise<TOTPEntry[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get('encryptedEntries');
      
      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        db.close();
        
        if (!result) {
          resolve([]);
          return;
        }
        
        try {
          const decrypted = decryptData(result.data, password);
          resolve(decrypted as TOTPEntry[]);
        } catch (error) {
          console.error('Failed to decrypt:', error);
          reject('Invalid password or corrupted data');
        }
      };
      
      request.onerror = (event) => {
        console.error('Error loading entries:', event);
        reject('Failed to load entries');
      };
    });
  } catch (error) {
    console.error('Failed to load entries:', error);
    throw error;
  }
};

// Check if database has entries
export const hasEntries = async (): Promise<boolean> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve) => {
      const request = store.get('encryptedEntries');
      
      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        db.close();
        resolve(!!result);
      };
      
      request.onerror = () => {
        db.close();
        resolve(false);
      };
    });
  } catch {
    return false;
  }
};

// Helper functions for encryption/decryption
const encryptData = (data: unknown, password: string): string => {
  const jsonStr = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonStr, password).toString();
};

const decryptData = (encrypted: string, password: string): unknown => {
  const bytes = CryptoJS.AES.decrypt(encrypted, password);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decrypted);
};
