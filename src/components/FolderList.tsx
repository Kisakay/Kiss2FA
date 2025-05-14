import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import FolderItem from './FolderItem';
import { Plus, Folder as FolderIcon } from 'lucide-react';

interface FolderListProps {
  activeFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

const FolderList: React.FC<FolderListProps> = ({ activeFolder, onSelectFolder }) => {
  const { folders, addFolder } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder({
        name: newFolderName.trim(),
        icon: '📁',
        color: '#3b82f6', // Default color
        isExpanded: true
      });
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateFolder();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewFolderName('');
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Folders
        </h3>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Add a folder"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="space-y-1">
        <div 
          className={`p-2 rounded-md cursor-pointer flex items-center ${activeFolder === null ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          onClick={() => onSelectFolder(null)}
        >
          <FolderIcon size={16} className="mr-2 text-gray-400" />
          <span className="text-gray-800 dark:text-gray-200">All codes</span>
        </div>

        {isCreating && (
          <div className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm">
            <div className="flex items-center">
              <span className="mr-2 text-gray-400">📁</span>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onBlur={() => newFolderName.trim() ? handleCreateFolder() : setIsCreating(false)}
                onKeyDown={handleKeyDown}
                placeholder="Folder name"
                autoFocus
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {folders.map(folder => (
          <FolderItem
            key={folder.id}
            folder={folder}
            isActive={activeFolder === folder.id}
            onSelect={onSelectFolder}
          />
        ))}
      </div>
    </div>
  );
};

export default FolderList;
