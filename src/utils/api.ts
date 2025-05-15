import { TOTPEntry, Folder } from '../types';

export interface VaultData {
  entries: TOTPEntry[];
  folders: Folder[];
}

export interface User {
  id: number;
  loginId: string;
  name: string;
  logo?: string;
}

export interface AuthError {
  error: string;
  attemptsLeft?: number;
  lockoutTime?: number;
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
 * Register a new user account
 */
export const registerUser = async (password: string): Promise<{ success: boolean; loginId?: string; error?: string }> => {
  try {
    if (!baseURL) {
      await initializeBaseURL();
    }
    
    const response = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to register' };
    }
    
    return { success: true, loginId: data.loginId };
  } catch (error) {
    console.error('Error registering user:', error);
    return { success: false, error: 'Network error' };
  }
};

/**
 * Login with credentials
 */
export const loginUser = async (loginId: string, password: string): Promise<{ success: boolean; user?: User; error?: string; attemptsLeft?: number }> => {
  try {
    if (!baseURL) {
      await initializeBaseURL();
    }
    
    const response = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ loginId, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || 'Failed to login',
        attemptsLeft: data.attemptsLeft
      };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, error: 'Network error' };
  }
};

/**
 * Logout the current user
 */
export const logoutUser = async (): Promise<boolean> => {
  try {
    if (!baseURL) {
      await initializeBaseURL();
    }
    
    const response = await fetch(`${baseURL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error logging out:', error);
    return false;
  }
};

/**
 * Check if user is authenticated
 */
export const checkAuthStatus = async (): Promise<{ authenticated: boolean; loginId?: string }> => {
  try {
    if (!baseURL) {
      await initializeBaseURL();
    }
    
    const response = await fetch(`${baseURL}/auth/status`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      return { authenticated: false };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return { authenticated: false };
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    if (!baseURL) {
      await initializeBaseURL();
    }
    
    const response = await fetch(`${baseURL}/user/profile`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to get profile' };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: 'Network error' };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (updates: { name?: string; logo?: string }): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!baseURL) {
      await initializeBaseURL();
    }
    
    const response = await fetch(`${baseURL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update profile' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Network error' };
  }
};

/**
 * Change user password
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!baseURL) {
      await initializeBaseURL();
    }
    
    const response = await fetch(`${baseURL}/user/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to change password' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, error: 'Network error' };
  }
};

/**
 * Load vault data (entries and folders) from the server (decrypted using password)
 */
export const loadVaultData = async (password: string): Promise<VaultData> => {
  try {
    if (!baseURL) {
      await initializeBaseURL();
    }
    
    const response = await fetch(`${baseURL}/vault/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const errorData = await response.json() as AuthError;
      // Create an enriched error with additional information
      const error = new Error(errorData.error || 'Failed to load vault data') as Error & AuthError;
      error.attemptsLeft = errorData.attemptsLeft;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Error loading vault data:', error);
    throw error;
  }
};

/**
 * Save vault data (entries and folders) to the server (encrypted with password)
 */
export const saveVaultData = async (data: VaultData, password: string): Promise<void> => {
  try {
    if (!baseURL) {
      await initializeBaseURL();
    }
    
    const response = await fetch(`${baseURL}/vault/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ data, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save vault data');
    }
  } catch (error) {
    console.error('Error saving vault data:', error);
    throw error;
  }
};

/**
 * Export vault to a file (requires password verification)
 */
export const exportVault = async (password: string): Promise<ExportedVault> => {
  try {
    if (!baseURL) {
      await initializeBaseURL();
    }
    
    const response = await fetch(`${baseURL}/vault/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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
    if (!baseURL) {
      await initializeBaseURL();
    }
    
    const response = await fetch(`${baseURL}/vault/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ data: importData.data, password }),
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

/**
 * Delete user account
 */
export const deleteAccount = async (password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!baseURL) {
      await initializeBaseURL();
    }
    
    const response = await fetch(`${baseURL}/user/delete-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to delete account' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, error: 'Network error' };
  }
};
