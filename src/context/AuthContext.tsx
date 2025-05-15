import React, { createContext, useContext, useEffect, useState } from 'react';
import { TOTPEntry, Folder } from '../types';
import { saveVaultSession, checkVaultSession, clearVaultSession } from '../utils/vault';
import { loadEntries, saveEntries, checkVaultExists, VaultData, AuthError } from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  entries: TOTPEntry[];
  folders: Folder[];
  addEntry: (entry: Omit<TOTPEntry, 'id'>) => void;
  updateEntry: (id: string, updates: Partial<Omit<TOTPEntry, 'id' | 'secret'>>) => void;
  deleteEntry: (id: string) => void;
  addFolder: (folder: Omit<Folder, 'id'>) => void;
  updateFolder: (id: string, updates: Partial<Omit<Folder, 'id'>>) => void;
  deleteFolder: (id: string) => void;
  moveEntryToFolder: (entryId: string, folderId: string | null) => void;
  moveFolderToFolder: (folderId: string, parentFolderId: string | null) => void;
  isLocked: boolean;
  unlock: (password: string) => Promise<boolean | AuthError>;
  lock: () => void;
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
  const [password, setPassword] = useState<string | null>(null);

  // Check session and load entries on mount
  useEffect(() => {
    const loadInitialEntries = async () => {
      if (checkVaultSession()) {
        try {
          if (password) {
            const loadedData = await loadEntries(password);
            
            // Gère la compatibilité avec l'ancien format (juste un tableau d'entrées)
            if (Array.isArray(loadedData)) {
              setEntries(loadedData);
              setFolders([]);
            } else {
              // Nouveau format avec entrées et dossiers
              const typedData = loadedData as VaultData;
              setEntries(typedData.entries || []);
              setFolders(typedData.folders || []);
            }
            
            setIsLocked(false);
          }
        } catch (error) {
          console.error('Failed to load entries:', error);
          setIsLocked(true);
        }
      } else {
        setIsLocked(true);
        setEntries([]);
        setFolders([]);
        setPassword(null);
      }
    };
    
    loadInitialEntries();
  }, [password]);

  // Save encrypted entries and folders whenever they change
  useEffect(() => {
    const saveData = async () => {
      if (!isLocked && password) {
        try {
          // Sauvegarde les entrées et les dossiers ensemble
          const dataToSave = {
            entries,
            folders
          };
          await saveEntries(dataToSave, password);
        } catch (error) {
          console.error('Failed to save data:', error);
        }
      }
    };
    
    saveData();
  }, [entries, folders, isLocked, password]);

  const unlock = async (attemptPassword: string): Promise<boolean | AuthError> => {
    try {
      // Check if vault exists on server before attempting to load
      const exists = await checkVaultExists();
      
      if (exists) {
        try {
          const loadedData = await loadEntries(attemptPassword);
          
          // Gère la compatibilité avec l'ancien format (juste un tableau d'entrées)
          if (Array.isArray(loadedData)) {
            setEntries(loadedData);
            setFolders([]);
          } else {
            // Nouveau format avec entrées et dossiers
            const typedData = loadedData as VaultData;
            setEntries(typedData.entries || []);
            setFolders(typedData.folders || []);
          }
          
          setPassword(attemptPassword);
          setIsLocked(false);
          saveVaultSession();
          return true;
        } catch (error) {
          console.error('Failed to unlock vault:', error);
          
          // Check if it's an authentication error with additional information
          const authError = error as Error & AuthError;
          if (authError.attemptsLeft !== undefined || authError.vaultErased) {
            return {
              error: authError.message,
              attemptsLeft: authError.attemptsLeft,
              vaultErased: authError.vaultErased
            };
          }
          
          return false;
        }
      } else {
        // For new vault, just set the password and unlock
        setPassword(attemptPassword);
        setIsLocked(false);
        saveVaultSession();
        return true;
      }
    } catch (error) {
      console.error('Failed to check vault existence:', error);
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
    <AuthContext.Provider value={{
      entries,
      folders,
      addEntry,
      updateEntry,
      deleteEntry,
      addFolder,
      updateFolder,
      deleteFolder,
      moveEntryToFolder,
      moveFolderToFolder,
      isLocked,
      unlock,
      lock
    }}>
      {children}
    </AuthContext.Provider>
  );
};