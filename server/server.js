import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import CryptoJS from 'crypto-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

// Set strict routing to false (helps with path-to-regexp compatibility in ESM)
app.set('strict routing', false);

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' })); // Increased limit for base64 images

// Ensure data directory exists
const DATA_FILE = path.join(__dirname, 'vault.json');

// Initialize empty data file if it doesn't exist or ensure it's valid JSON
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ entries: null }), 'utf8');
} else {
  try {
    // Verify the file contains valid JSON
    JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (error) {
    console.error('Invalid vault.json file, reinitializing:', error);
    fs.writeFileSync(DATA_FILE, JSON.stringify({ entries: null }), 'utf8');
  }
}

// Check if vault exists
app.get('/api/vault/exists', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json({ exists: !!data.entries });
  } catch (error) {
    console.error('Error checking vault existence:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get entries (requires password for decryption)
app.post('/api/entries', (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    if (!data.entries) {
      return res.json([]);
    }

    try {
      // Attempt to decrypt with provided password
      const bytes = CryptoJS.AES.decrypt(data.entries, password);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      const entries = JSON.parse(decryptedData);
      
      // Vérifier si les données sont au nouveau format (avec dossiers)
      if (data.folders) {
        try {
          const folderBytes = CryptoJS.AES.decrypt(data.folders, password);
          const decryptedFolders = folderBytes.toString(CryptoJS.enc.Utf8);
          const folders = JSON.parse(decryptedFolders);
          
          // Renvoyer le nouveau format avec entrées et dossiers
          res.json({
            entries: entries,
            folders: folders
          });
          return;
        } catch (folderError) {
          console.error('Error decrypting folders:', folderError);
          // Continuer avec seulement les entrées si les dossiers ne peuvent pas être décryptés
        }
      }
      
      // Renvoyer l'ancien format (juste les entrées)
      res.json(entries);
    } catch (decryptError) {
      console.error('Decryption error:', decryptError);
      res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save entries and folders (with encryption)
app.post('/api/entries/save', (req, res) => {
  try {
    const { entries, folders, password } = req.body;
    if (!password || !entries) {
      return res.status(400).json({ error: 'Password and entries required' });
    }

    // Encrypt the entries
    const encryptedEntries = CryptoJS.AES.encrypt(
      JSON.stringify(entries),
      password
    ).toString();
    
    // Préparer les données à sauvegarder
    const dataToSave = { entries: encryptedEntries };
    
    // Encrypt the folders if they exist
    if (folders) {
      const encryptedFolders = CryptoJS.AES.encrypt(
        JSON.stringify(folders),
        password
      ).toString();
      dataToSave.folders = encryptedFolders;
    }

    // Save to JSON file
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave), 'utf8');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving entries:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export vault (requires password for verification)
app.post('/api/vault/export', (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    if (!data.entries) {
      return res.status(404).json({ error: 'No vault found' });
    }

    try {
      // First verify the password is correct by attempting to decrypt
      const bytes = CryptoJS.AES.decrypt(data.entries, password);
      bytes.toString(CryptoJS.enc.Utf8); // This will throw if password is incorrect

      // Password is correct, send the encrypted data for export
      res.json({
        data: data.entries,
        timestamp: new Date().toISOString(),
        format: 'Kiss2FA-Vault-v1'
      });
    } catch (decryptError) {
      console.error('Decryption error during export:', decryptError);
      res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error exporting vault:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Import vault (requires password for the imported data)
app.post('/api/vault/import', (req, res) => {
  try {
    const { importData, password } = req.body;

    if (!password || !importData || !importData.data || !importData.format) {
      return res.status(400).json({ error: 'Password and valid import data required' });
    }

    // Verify format is supported
    if (importData.format !== 'Kiss2FA-Vault-v1') {
      return res.status(400).json({ error: 'Unsupported vault format' });
    }

    try {
      // Attempt to decrypt with provided password to verify data integrity
      const bytes = CryptoJS.AES.decrypt(importData.data, password);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      JSON.parse(decryptedData); // This will throw if JSON is invalid

      // Save the imported vault
      fs.writeFileSync(DATA_FILE, JSON.stringify({ entries: importData.data }), 'utf8');
      res.json({ success: true });
    } catch (importError) {
      console.error('Error importing vault:', importError);
      res.status(401).json({ error: 'Invalid password or corrupted import data' });
    }
  } catch (error) {
    console.error('Server error during import:', error);
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
