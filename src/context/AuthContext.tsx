import React, { createContext, useContext, useEffect, useState } from 'react';
import { TOTPEntry, Folder } from '../types';
import { saveVaultSession, checkVaultSession, clearVaultSession } from '../utils/vault';
import { 
  loadVaultData, 
  saveVaultData, 
  registerUser, 
  loginUser, 
  logoutUser, 
  checkAuthStatus, 
  getUserProfile, 
  updateUserProfile, 
  changePassword,
  deleteAccount,
  User,
  AuthError 
} from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  entries: TOTPEntry[];
  folders: Folder[];
  user: User | null;
  addEntry: (entry: Omit<TOTPEntry, 'id'>) => void;
  updateEntry: (id: string, updates: Partial<Omit<TOTPEntry, 'id' | 'secret'>>) => void;
  deleteEntry: (id: string) => void;
  addFolder: (folder: Omit<Folder, 'id'>) => void;
  updateFolder: (id: string, updates: Partial<Omit<Folder, 'id'>>) => void;
  deleteFolder: (id: string) => void;
  moveEntryToFolder: (entryId: string, folderId: string | null) => void;
  moveFolderToFolder: (folderId: string, parentFolderId: string | null) => void;
  isLocked: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;
  register: (password: string) => Promise<{success: boolean; loginId?: string; error?: string}>;
  login: (loginId: string, password: string) => Promise<boolean | AuthError>;
  logout: () => Promise<void>;
  unlock: (password: string) => Promise<boolean | AuthError>;
  lock: () => void;
  updateProfile: (updates: {name?: string; logo?: string}) => Promise<{success: boolean; error?: string}>;
  changeUserPassword: (currentPassword: string, newPassword: string) => Promise<{success: boolean; error?: string}>;
  deleteUserAccount: (password: string) => Promise<{success: boolean; error?: string}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<TOTPEntry[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLocked, setIsLocked] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const authStatus = await checkAuthStatus();
        
        if (authStatus.authenticated) {
          setIsAuthenticated(true);
          
          // Get user profile
          const profileResult = await getUserProfile();
          if (profileResult.success && profileResult.user) {
            setUser(profileResult.user);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to check auth status:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Load vault data when password is provided and user is authenticated
  useEffect(() => {
    const loadVault = async () => {
      if (isAuthenticated && password && checkVaultSession()) {
        try {
          const data = await loadVaultData(password);
          setEntries(data.entries || []);
          setFolders(data.folders || []);
          setIsLocked(false);
        } catch (error) {
          console.error('Failed to load vault data:', error);
          setIsLocked(true);
          clearVaultSession();
        }
      } else if (!checkVaultSession()) {
        setIsLocked(true);
        setEntries([]);
        setFolders([]);
        setPassword(null);
      }
    };
    
    loadVault();
  }, [isAuthenticated, password]);

  // Save encrypted entries and folders whenever they change
  useEffect(() => {
    const saveData = async () => {
      if (!isLocked && isAuthenticated && password) {
        try {
          // Save entries and folders together
          const dataToSave = {
            entries,
            folders
          };
          await saveVaultData(dataToSave, password);
        } catch (error) {
          console.error('Failed to save data:', error);
        }
      }
    };
    
    saveData();
  }, [entries, folders, isLocked, isAuthenticated, password]);

  const register = async (password: string) => {
    try {
      setIsLoading(true);
      const result = await registerUser(password);
      
      if (result.success) {
        // Get user profile after registration
        const profileResult = await getUserProfile();
        if (profileResult.success && profileResult.user) {
          setUser(profileResult.user);
        }
        
        setIsAuthenticated(true);
        setLoginError(null);
      } else {
        setLoginError(result.error || 'Registration failed');
      }
      
      return result;
    } catch (error) {
      console.error('Failed to register:', error);
      setLoginError('Registration failed');
      return { success: false, error: 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };
  
  const login = async (loginId: string, attemptPassword: string): Promise<boolean | AuthError> => {
    try {
      setIsLoading(true);
      setLoginError(null);
      
      const result = await loginUser(loginId, attemptPassword);
      
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setLoginError(result.error || 'Login failed');
        
        if (result.attemptsLeft !== undefined) {
          return {
            error: result.error || 'Invalid login credentials',
            attemptsLeft: result.attemptsLeft
          };
        }
        
        return false;
      }
    } catch (error) {
      console.error('Failed to login:', error);
      setLoginError('Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      await logoutUser();
      setIsAuthenticated(false);
      setUser(null);
      lock();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };
  
  const updateProfile = async (updates: {name?: string; logo?: string}) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const result = await updateUserProfile(updates);
      
      if (result.success) {
        // Update local user state
        setUser(prev => prev ? {...prev, ...updates} : null);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to update profile:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  };
  
  const changeUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const result = await changePassword(currentPassword, newPassword);
      
      if (result.success) {
        // Update local password state
        setPassword(newPassword);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to change password:', error);
      return { success: false, error: 'Failed to change password' };
    }
  };

  const deleteUserAccount = async (password: string) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      const result = await deleteAccount(password);
      
      if (result.success) {
        // Logout and clear all data
        setIsAuthenticated(false);
        setUser(null);
        lock();
      }
      
      return result;
    } catch (error) {
      console.error('Failed to delete account:', error);
      return { success: false, error: 'Failed to delete account' };
    }
  };
  
  const unlock = async (attemptPassword: string): Promise<boolean | AuthError> => {
    if (!isAuthenticated) {
      return false;
    }
    
    try {
      const result = await loadVaultData(attemptPassword);
      
      setEntries(result.entries || []);
      setFolders(result.folders || []);
      setPassword(attemptPassword);
      setIsLocked(false);
      saveVaultSession();
      
      return true;
    } catch (error) {
      console.error('Failed to unlock vault:', error);
      
      // Check if it's an authentication error with additional information
      const authError = error as Error & AuthError;
      if (authError.attemptsLeft !== undefined) {
        return {
          error: authError.message,
          attemptsLeft: authError.attemptsLeft
        };
      }
      
      return false;
    }
  };

  const lock = () => {
    setIsLocked(true);
    setEntries([]);
    setFolders([]);
    setPassword(null);
    clearVaultSession();
  };

  const addEntry = (entry: Omit<TOTPEntry, 'id'>) => {
    const newEntry: TOTPEntry = {
      ...entry,
      id: uuidv4(),
      period: entry.period || 30,
      digits: entry.digits || 6,
      isCustomIcon: entry.icon.startsWith('data:image') || false
    };
    setEntries((prev) => [...prev, newEntry]);
  };

  const updateEntry = (id: string, updates: Partial<Omit<TOTPEntry, 'id' | 'secret'>>) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    );
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const addFolder = (folder: Omit<Folder, 'id'>) => {
    const newFolder: Folder = {
      ...folder,
      id: uuidv4(),
      isExpanded: true
    };
    setFolders((prev) => [...prev, newFolder]);
  };

  const updateFolder = (id: string, updates: Partial<Omit<Folder, 'id'>>) => {
    setFolders((prev) =>
      prev.map((folder) => (folder.id === id ? { ...folder, ...updates } : folder))
    );
  };

  const deleteFolder = (id: string) => {
    // Récupérer tous les sous-dossiers récursivement
    const getSubFolderIds = (folderId: string): string[] => {
      const directSubFolders = folders.filter(f => f.parentId === folderId).map(f => f.id);
      const allSubFolders = [...directSubFolders];
      
      directSubFolders.forEach(subId => {
        allSubFolders.push(...getSubFolderIds(subId));
      });
      
      return allSubFolders;
    };
    
    const subFolderIds = getSubFolderIds(id);
    const allFolderIdsToDelete = [id, ...subFolderIds];
    
    // Supprime le dossier et tous ses sous-dossiers
    setFolders((prev) => prev.filter((folder) => !allFolderIdsToDelete.includes(folder.id)));
    
    // Déplace toutes les entrées des dossiers supprimés vers la racine
    setEntries((prev) =>
      prev.map((entry) => allFolderIdsToDelete.includes(entry.folderId || '') ? { ...entry, folderId: undefined } : entry)
    );
  };

  const moveEntryToFolder = (entryId: string, folderId: string | null) => {
    setEntries((prev) =>
      prev.map((entry) => entry.id === entryId ? { ...entry, folderId: folderId || undefined } : entry)
    );
  };

  const moveFolderToFolder = (folderId: string, parentFolderId: string | null) => {
    // Vérifier qu'on ne crée pas de cycle (un dossier ne peut pas être son propre parent)
    if (folderId === parentFolderId) return;
    
    // Vérifier qu'on ne crée pas de cycle dans l'arborescence
    const wouldCreateCycle = (targetId: string, potentialParentId: string): boolean => {
      if (targetId === potentialParentId) return true;
      
      const parent = folders.find(f => f.id === potentialParentId);
      if (!parent || !parent.parentId) return false;
      
      return wouldCreateCycle(targetId, parent.parentId);
    };
    
    if (parentFolderId && wouldCreateCycle(parentFolderId, folderId)) return;
    
    // Déplacer le dossier
    setFolders((prev) =>
      prev.map((folder) => folder.id === folderId ? { ...folder, parentId: parentFolderId || undefined } : folder)
    );
  };

  return (
    <AuthContext.Provider
      value={{
        entries,
        folders,
        user,
        addEntry,
        updateEntry,
        deleteEntry,
        addFolder,
        updateFolder,
        deleteFolder,
        moveEntryToFolder,
        moveFolderToFolder,
        isLocked,
        isAuthenticated,
        isLoading,
        loginError,
        register,
        login,
        logout,
        unlock,
        lock,
        updateProfile,
        changeUserPassword,
        deleteUserAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};