import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthError } from '../utils/api';
import { Lock, AlertCircle, CloudOff, Loader2 } from 'lucide-react';
import { isServerOnline } from '../utils/serverStatus';

const UnlockForm: React.FC = () => {
  const { unlock, user } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('online');
  
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const online = await isServerOnline();
        setServerStatus(online ? 'online' : 'offline');
      } catch (error) {
        console.error('Error checking server status:', error);
        setServerStatus('offline');
      }
    };
    
    checkServerStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (serverStatus === 'offline') {
      setError('Server is offline. Cannot proceed.');
      setIsLoading(false);
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      setIsLoading(false);
      return;
    }

    try {
      const online = await isServerOnline();
      if (!online) {
        setServerStatus('offline');
        setError('Server went offline. Cannot proceed.');
        setIsLoading(false);
        return;
      }
      
      const result = await unlock(password.trim());
      
      if (typeof result === 'object' && 'error' in result) {
        // Authentication error with additional information
        const authError = result as AuthError;
        setError(authError.error);
        setAttemptsLeft(authError.attemptsLeft);
        
        if (authError.attemptsLeft !== undefined) {
          setError(`Invalid password. You have ${authError.attemptsLeft} attempt(s) left.`);
        }
        
        setPassword('');
      } else if (result !== true) {
        setError('Invalid password');
        setPassword('');
      }
    } catch (error) {
      console.error('Error unlocking vault:', error);
      setError('Failed to unlock vault. Please try again.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 flex justify-center items-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }
  
  if (serverStatus === 'offline' && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
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
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Unlock Vault
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
            Enter your password to access your authentication codes
          </p>
          {user && user.name && (
            <p className="text-gray-700 dark:text-gray-300 font-medium mt-2">
              {user.name}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-300 rounded-lg flex flex-col">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-red-600" />
                <p>{error}</p>
              </div>
              
              {attemptsLeft !== undefined && (
                <div className="mt-3 w-full pl-7">
                  <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-500 h-full" 
                      style={{ width: `${(attemptsLeft / 5) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                    {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your password"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UnlockForm;