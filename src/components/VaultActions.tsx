import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, AlertCircle, CheckCircle, MoreVertical, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { exportVault, importVault, ExportedVault } from '../utils/api';

interface VaultActionsProps {
  className?: string;
}

const VaultActions: React.FC<VaultActionsProps> = ({ className }) => {
  const { isLocked, lock } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [password, setPassword] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset modal state on close
  const resetState = () => {
    setPassword('');
    setImportPassword('');
    setStatusMessage(null);
    setImportFile(null);
  };

  // Handle export button click
  const handleExportClick = () => {
    setIsExporting(true);
    setMenuOpen(false);
    resetState();
  };

  // Handle export submission
  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    try {
      const exportedData = await exportVault(password);

      // Create and download the file
      const dataStr = JSON.stringify(exportedData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(dataBlob);

      const fileName = `xVault-vault-${new Date().toISOString().split('T')[0]}.json`;
      downloadLink.download = fileName;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setStatusMessage({ type: 'success', text: 'Vault exported successfully!' });

      // Clear password after short delay
      setTimeout(() => {
        setPassword('');
      }, 1000);
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to export vault'
      });
    }
  };

  // Handle import button click
  const handleImportClick = () => {
    setIsImporting(true);
    setMenuOpen(false);
    resetState();
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
      setStatusMessage(null);
    }
  };

  // Handle import submission
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!importFile) {
      setStatusMessage({ type: 'error', text: 'Please select a file to import' });
      return;
    }

    try {
      // Read the file
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const importData = JSON.parse(content) as ExportedVault;

          // Validate file format
          let whitelisted_format_name = [
            "Kiss2FA-Vault-v1",
            "xVault-Vault-v1",
          ]

          if (!importData.format || !whitelisted_format_name.includes(importData.format)) {
            setStatusMessage({ type: 'error', text: 'Invalid vault file format' });
            return;
          }

          await importVault(importData, importPassword);
          setStatusMessage({ type: 'success', text: 'Vault imported successfully! Please reload the application.' });

          // Clear password after short delay
          setTimeout(() => {
            setImportPassword('');
          }, 1000);
        } catch (parseError) {
          setStatusMessage({ type: 'error', text: 'Failed to parse import file' });
        }
      };

      reader.onerror = () => {
        setStatusMessage({ type: 'error', text: 'Failed to read import file' });
      };

      reader.readAsText(importFile);
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to import vault'
      });
    }
  };

  // Don't display when the vault is locked
  if (isLocked) {
    return null;
  }

  return (
    <div className={className} ref={menuRef}>
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
            <div className="py-1" role="menu" aria-orientation="vertical">
              <button
                onClick={handleExportClick}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                role="menuitem"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Vault
              </button>
              <button
                onClick={handleImportClick}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                role="menuitem"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Vault
              </button>
              <button
                onClick={lock}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                role="menuitem"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Lock Vault
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Vault</h3>

            <form onSubmit={handleExport}>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please enter your vault password to export your data. The exported file will be encrypted with this password.
              </p>

              <div className="mb-4">
                <label htmlFor="export-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vault Password
                </label>
                <input
                  id="export-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your vault password"
                  required
                />
              </div>

              {statusMessage && (
                <div className={`p-3 mb-4 rounded-md flex items-center ${statusMessage.type === 'success'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                  }`}>
                  {statusMessage.type === 'success'
                    ? <CheckCircle className="w-5 h-5 mr-2" />
                    : <AlertCircle className="w-5 h-5 mr-2" />
                  }
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsExporting(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!password}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import Vault</h3>

            <form onSubmit={handleImport}>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload a previously exported xVault vault file. You'll need the same password that was used to export the file.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vault File
                </label>
                <div className="flex items-center">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                    id="vault-file-input"
                  />
                  <label
                    htmlFor="vault-file-input"
                    className="cursor-pointer px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md transition-colors flex-shrink-0"
                  >
                    Choose File
                  </label>
                  <span className="ml-2 text-gray-600 dark:text-gray-400 truncate">
                    {importFile ? importFile.name : 'No file selected'}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="import-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vault Password
                </label>
                <input
                  id="import-password"
                  type="password"
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter the password for this vault file"
                  required
                />
              </div>

              {statusMessage && (
                <div className={`p-3 mb-4 rounded-md flex items-center ${statusMessage.type === 'success'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                  }`}>
                  {statusMessage.type === 'success'
                    ? <CheckCircle className="w-5 h-5 mr-2" />
                    : <AlertCircle className="w-5 h-5 mr-2" />
                  }
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsImporting(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!importFile || !importPassword}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultActions;
