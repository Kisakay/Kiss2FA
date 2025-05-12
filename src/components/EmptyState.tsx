import React from 'react';
import { ShieldAlert, PlusCircle } from 'lucide-react';

interface EmptyStateProps {
  onAddNew: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddNew }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
      <ShieldAlert className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No authentication keys yet
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        Add your first TOTP key to start generating two-factor authentication codes for your accounts.
      </p>
      <button
        onClick={onAddNew}
        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-sm"
      >
        <PlusCircle className="w-5 h-5 mr-2" />
        Add Your First Key
      </button>
    </div>
  );
};

export default EmptyState;