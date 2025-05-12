import { TOTPEntry } from '../types';

// Exporter l'URL pour qu'elle puisse être utilisée par d'autres modules
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Type pour les données du vault exporté
export interface ExportedVault {
  data: string; // Données chiffrées
  timestamp: string;
  format: string;
}

/**
 * Check if a vault exists on the server
 */
export const checkVaultExists = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/vault/exists`);
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking if vault exists:', error);
    return false;
  }
};

/**
 * Load TOTP entries from the server (decrypted using password)
 */
export const loadEntries = async (password: string): Promise<TOTPEntry[]> => {
  try {
    const response = await fetch(`${API_URL}/entries`, {
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
 * Save TOTP entries to the server (encrypted with password)
 */
export const saveEntries = async (entries: TOTPEntry[], password: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/entries/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries, password }),
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
    const response = await fetch(`${API_URL}/vault/export`, {
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
    const response = await fetch(`${API_URL}/vault/import`, {
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
