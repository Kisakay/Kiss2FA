import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Key, AlertCircle, QrCode } from 'lucide-react';
import QRCodeScanner from './QRCodeScanner';

interface AddTOTPFormProps {
  onSuccess: () => void;
}

const AddTOTPForm: React.FC<AddTOTPFormProps> = ({ onSuccess }) => {
  const { addEntry } = useAuth();
  const [name, setName] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

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
  
  // Function to handle scanned QR code data
  const handleQRCodeScan = (data: string) => {
    try {
      // Close the scanner
      setShowScanner(false);
      
      // Parse the TOTP QR code URL
      // Typical format: otpauth://totp/LABEL?secret=SECRET&issuer=ISSUER&...
      const url = new URL(data);
      
      if (url.protocol !== 'otpauth:') {
        setError('Invalid QR code. This is not a TOTP authentication code.');
        return;
      }
      
      // Extract parameters
      const params = new URLSearchParams(url.search);
      const secret = params.get('secret');
      
      if (!secret) {
        setError('Invalid QR code. No secret key found.');
        return;
      }
      
      // Extract account name
      // Path format: /totp/LABEL or /totp/ISSUER:LABEL
      let label = decodeURIComponent(url.pathname.split('/').pop() || '');
      const issuer = params.get('issuer');
      
      // If the label already contains the issuer (ISSUER:LABEL format), use it directly
      // Otherwise, prefix with the issuer if available
      if (!label.includes(':') && issuer) {
        label = `${issuer}: ${label}`;
      }
      
      // Update form fields
      setSecret(secret);
      if (label) setName(label);
      
      // Clear previous errors
      setError('');
    } catch (err) {
      console.error('Error parsing QR code:', err);
      setError('Invalid QR code or unrecognized format.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {showScanner && (
        <QRCodeScanner 
          onScan={handleQRCodeScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}
      
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
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter the secret key provided by the service
          </p>
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          >
            <QrCode className="w-4 h-4 mr-1" />
            Scan QR code
          </button>
        </div>
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