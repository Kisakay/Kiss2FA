import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TOTPCard from './TOTPCard';
import AddTOTPForm from './AddTOTPForm';
import EmptyState from './EmptyState';
import VaultActions from './VaultActions';
import { PlusCircle, X } from 'lucide-react';

const AuthenticatorApp: React.FC = () => {
  const { entries } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Update time every second to keep countdown accurate
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const filteredEntries = entries.filter(entry => 
    entry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full mx-auto h-full overflow-auto pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Authenticator</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your two-factor authentication codes
              </p>
            </div>
            <VaultActions className="md:hidden" />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-sm"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add New Key
          </button>
          <VaultActions className="hidden md:block" />
        </div>
      </div>
      
      {entries.length > 0 && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState onAddNew={() => setShowAddForm(true)} />
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No accounts match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEntries.map((entry) => (
            <TOTPCard 
              key={entry.id} 
              entry={entry}
              currentTime={currentTime}
            />
          ))}
        </div>
      )}
      
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New TOTP Key</h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <AddTOTPForm onSuccess={() => setShowAddForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthenticatorApp;