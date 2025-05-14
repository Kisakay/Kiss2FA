import { TOTPEntry, Folder } from '../types';

export interface VaultData {
  entries: TOTPEntry[];
  folders: Folder[];
}
import { loadConfig } from './config';

let baseURL: string | null = null;

const initializeBaseURL = async () => {
  try {
    const config = await loadConfig();
    baseURL = config.API_URL;
    return baseURL;
  } catch (error) {
    console.error('Failed to initialize API URL:', error);
    throw error;
  }
};

initializeBaseURL();

export interface ExportedVault {
  data: string;
  timestamp: string;
  format: string;
}

/**
 * Check if a vault exists on the server
 */
export const checkVaultExists = async (): Promise<boolean> => {
  try {
    if (!baseURL) {
      await initializeBaseURL();
    }
    
    const response = await fetch(`${baseURL}/vault/exists`);
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking if vault exists:', error);
    return false;
  }
};

/**
 * Load vault data (entries and folders) from the server (decrypted using password)
 */
export const loadEntries = async (password: string): Promise<TOTPEntry[] | VaultData> => {
  try {
    const response = await fetch(`${baseURL}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to load entries');
    }

    return await response.json();
  } catch (error) {
    console.error('Error loading entries:', error);
    throw error;
  }
};

/**
 * Save vault data (entries and folders) to the server (encrypted with password)
 */
export const saveEntries = async (data: TOTPEntry[] | VaultData, password: string): Promise<void> => {
  try {
    // Compatibilité avec l'ancien format
    const payload = Array.isArray(data)
      ? { entries: data, folders: [] }
      : data;
    
    const response = await fetch(`${baseURL}/entries/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries: payload.entries, folders: payload.folders, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save entries');
    }
  } catch (error) {
    console.error('Error saving entries:', error);
    throw error;
  }
};

/**
 * Export vault to a file (requires password verification)
 */
export const exportVault = async (password: string): Promise<ExportedVault> => {
  try {
    const response = await fetch(`${baseURL}/vault/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to export vault');
    }

    return await response.json();
  } catch (error) {
    console.error('Error exporting vault:', error);
    throw error;
  }
};

/**
 * Import vault from exported data (requires password to decrypt)
 */
export const importVault = async (importData: ExportedVault, password: string): Promise<void> => {
  try {
    const response = await fetch(`${baseURL}/vault/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ importData, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to import vault');
    }
  } catch (error) {
    console.error('Error importing vault:', error);
    throw error;
  }
};
