import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginForm: React.FC = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginIdCopied, setLoginIdCopied] = useState(false);
  const [newLoginId, setNewLoginId] = useState<string | null>(null);

  const { login, register, loginError, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegistering) {
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      const result = await register(password);
      if (result.success && result.loginId) {
        setNewLoginId(result.loginId);
      } else {
        setError(result.error || 'Registration failed');
      }
    } else {
      if (!loginId) {
        setError('Login ID is required');
        return;
      }
      if (!password) {
        setError('Password is required');
        return;
      }

      const result = await login(loginId, password);
      if (result !== true && typeof result !== 'boolean') {
        setError(result.error || 'Login failed');
      }
    }
  };

  const copyLoginId = () => {
    if (newLoginId) {
      navigator.clipboard.writeText(newLoginId);
      setLoginIdCopied(true);
      setTimeout(() => setLoginIdCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setNewLoginId(null);
    setPassword('');
    setLoginId('');
    setError(null);
  };

  if (newLoginId) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Registration Successful</h2>
        
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
          <p className="text-green-800 dark:text-green-200 mb-2">Your account has been created successfully!</p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            <strong>Important:</strong> Please save your login ID. You will need it to access your vault.
          </p>
          
          <div className="flex items-center mb-2">
            <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono text-sm overflow-x-auto">
              {newLoginId}
            </div>
            <button 
              onClick={copyLoginId}
              className="ml-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              {loginIdCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        
        <button
          onClick={() => {
            setIsRegistering(false);
            resetForm();
          }}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Continue to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        {isRegistering ? 'Create a New Vault' : 'Access Your Vault'}
      </h2>
      
      {(error || loginError) && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
          {error || loginError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {!isRegistering && (
          <div className="mb-4">
            <label htmlFor="loginId" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Login ID
            </label>
            <input
              type="text"
              id="loginId"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter your login ID"
              autoComplete="username"
            />
          </div>
        )}
        
        <div className="mb-6">
          <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {isRegistering ? 'Create Password' : 'Password'}
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={isRegistering ? "Create a strong password" : "Enter your password"}
            autoComplete={isRegistering ? "new-password" : "current-password"}
          />
          {isRegistering && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This password will be used to encrypt your vault. Make sure it's strong and you remember it.
            </p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : isRegistering ? 'Create Vault' : 'Unlock Vault'}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            resetForm();
          }}
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isRegistering ? 'Already have a vault? Login' : 'Create a new vault'}
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
