import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Key, AlertCircle } from 'lucide-react';

interface AddTOTPFormProps {
  onSuccess: () => void;
}

const AddTOTPForm: React.FC<AddTOTPFormProps> = ({ onSuccess }) => {
  const { addEntry } = useAuth();
  const [name, setName] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!name.trim()) {
      setError('Please enter a name for this account');
      return;
    }
    
    if (!secret.trim()) {
      setError('Please enter the secret key');
      return;
    }
    
    // Normalize secret (remove spaces, make uppercase)
    const normalizedSecret = secret.toUpperCase().replace(/\s/g, '');
    
    // Basic validation for Base32 characters
    const base32Regex = /^[A-Z2-7]+=*$/;
    if (!base32Regex.test(normalizedSecret)) {
      setError('Invalid secret key format. Secret keys should only contain letters A-Z and numbers 2-7');
      return;
    }
    
    // Add the new TOTP entry
    addEntry({
      name: name.trim(),
      secret: normalizedSecret,
      icon: '🔐',
      period: 30,
      digits: 6,
    });
    
    // Clear form and close
    setName('');
    setSecret('');
    setError('');
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg text-red-800 dark:text-red-300 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="account-name">
          Account Name
        </label>
        <input
          id="account-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Google, GitHub, AWS"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
          required
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="secret-key">
          Secret Key
        </label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          <input
            id="secret-key"
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="JBSWY3DPEHPK3PXP"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter the secret key provided by the service (usually shown as text or in a QR code)
        </p>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onSuccess}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
        >
          Add Account
        </button>
      </div>
    </form>
  );
};

export default AddTOTPForm;