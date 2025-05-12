import React, { createContext, useContext, useEffect, useState } from 'react';
import { TOTPEntry } from '../types';
import { saveVaultSession, checkVaultSession, clearVaultSession } from '../utils/vault';
import { loadEntries, saveEntries, checkVaultExists } from '../utils/api';

interface AuthContextType {
  entries: TOTPEntry[];
  addEntry: (entry: Omit<TOTPEntry, 'id'>) => void;
  updateEntry: (id: string, updates: Partial<Omit<TOTPEntry, 'id' | 'secret'>>) => void;
  deleteEntry: (id: string) => void;
  isLocked: boolean;
  unlock: (password: string) => Promise<boolean>;
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
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState<string | null>(null);

  // Check session and load entries on mount
  useEffect(() => {
    const loadInitialEntries = async () => {
      if (checkVaultSession()) {
        try {
          if (password) {
            const loadedEntries = await loadEntries(password);
            setEntries(loadedEntries);
            setIsLocked(false);
          }
        } catch (error) {
          console.error('Failed to load entries:', error);
          setIsLocked(true);
        }
      } else {
        setIsLocked(true);
        setEntries([]);
        setPassword(null);
      }
    };
    
    loadInitialEntries();
  }, [password]);

  // Save encrypted entries whenever they change
  useEffect(() => {
    const saveEntriesData = async () => {
      if (!isLocked && password) {
        try {
          await saveEntries(entries, password);
        } catch (error) {
          console.error('Failed to save entries:', error);
        }
      }
    };
    
    saveEntriesData();
  }, [entries, isLocked, password]);

  const unlock = async (attemptPassword: string): Promise<boolean> => {
    try {
      // Check if vault exists on server before attempting to load
      const exists = await checkVaultExists();
      
      if (exists) {
        try {
          const loadedEntries = await loadEntries(attemptPassword);
          setEntries(loadedEntries);
          setPassword(attemptPassword);
          setIsLocked(false);
          saveVaultSession();
          return true;
        } catch (error) {
          console.error('Failed to unlock vault:', error);
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
    setPassword(null);
    clearVaultSession();
  };

  const addEntry = (entry: Omit<TOTPEntry, 'id'>) => {
    const newEntry: TOTPEntry = {
      ...entry,
      id: crypto.randomUUID(),
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

  return (
    <AuthContext.Provider value={{ entries, addEntry, updateEntry, deleteEntry, isLocked, unlock, lock }}>
      {children}
    </AuthContext.Provider>
  );
};