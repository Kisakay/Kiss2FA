import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle, CloudOff, Loader2 } from 'lucide-react';
import { checkVaultExists } from '../utils/api';
import { isServerOnline } from '../utils/serverStatus';

const UnlockForm: React.FC = () => {
  const { unlock } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isNewVault, setIsNewVault] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  useEffect(() => {
    const checkServerAndVault = async () => {
      try {
        const online = await isServerOnline();
        setServerStatus(online ? 'online' : 'offline');
        
        if (online) {
          const exists = await checkVaultExists();
          setIsNewVault(!exists);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking server status or vault:', error);
        setServerStatus('offline');
        setIsLoading(false);
      }
    };
    
    checkServerAndVault();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (serverStatus === 'offline') {
      setError('Server is offline. Cannot proceed.');
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    if (isNewVault) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    try {
      const online = await isServerOnline();
      if (!online) {
        setServerStatus('offline');
        setError('Server went offline. Cannot proceed.');
        return;
      }
      
      const success = await unlock(password.trim());
      if (!success && !isNewVault) {
        setError('Invalid password');
        setPassword('');
      }
    } catch (error) {
      console.error('Error unlocking vault:', error);
      setError('Failed to unlock vault. Please try again.');
      setPassword('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 flex justify-center items-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }
  
  if (serverStatus === 'offline' && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <CloudOff className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Server Offline
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
              Cannot connect to server. Please ensure the server is running and try again.
            </p>
          </div>
          <button
            onClick={() => {
              setServerStatus('checking');
              setIsLoading(true);
              setTimeout(() => {
                isServerOnline().then(online => {
                  setServerStatus(online ? 'online' : 'offline');
                  setIsLoading(false);
                });
              }, 1000);
            }}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isNewVault ? 'Create Password' : 'Unlock Vault'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
            {isNewVault 
              ? 'Create a password to secure your authentication codes'
              : 'Enter your password to access your authentication codes'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg text-red-800 dark:text-red-300 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">
              {isNewVault ? 'New Password' : 'Password'}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder={isNewVault ? 'Create a strong password' : 'Enter your password'}
              autoFocus
            />
            {isNewVault && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Must be at least 8 characters long
              </p>
            )}
          </div>

          {isNewVault && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Confirm your password"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
          >
            {isNewVault ? 'Create Vault' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UnlockForm;