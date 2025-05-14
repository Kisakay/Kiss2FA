import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TOTPCard from './TOTPCard';
import AddTOTPForm from './AddTOTPForm';
import EmptyState from './EmptyState';
import VaultActions from './VaultActions';
import FolderList from './FolderList';
import { PlusCircle, X, FolderPlus } from 'lucide-react';

const AuthenticatorApp: React.FC = () => {
  const { entries, folders, addFolder, moveEntryToFolder } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showFolderSelector, setShowFolderSelector] = useState<string | null>(null);

  // Update time every second to keep countdown accurate
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Filtrer les entrées par dossier et terme de recherche
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = activeFolder === null || entry.folderId === activeFolder;
    return matchesSearch && matchesFolder;
  });
  
  // Obtenir le nom du dossier actif
  const activeFolderName = activeFolder 
    ? folders.find(f => f.id === activeFolder)?.name || 'Unknown Folder'
    : 'All Codes';

  // Gérer le déplacement d'une entrée vers un dossier
  const handleMoveToFolder = (entryId: string, folderId: string | null) => {
    moveEntryToFolder(entryId, folderId);
    setShowFolderSelector(null);
  };

  // Créer un nouveau dossier rapidement
  const handleQuickCreateFolder = () => {
    const folderName = prompt('Folder name:');
    if (folderName && folderName.trim()) {
      addFolder({
        name: folderName.trim(),
        icon: '📁',
        color: '#3b82f6',
        isExpanded: true
      });
    }
  };

  return (
    <div className="w-full mx-auto h-full overflow-hidden flex">
      {/* Barre latérale des dossiers */}
      <div className="w-64 h-full border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto hidden md:block">
        <FolderList 
          activeFolder={activeFolder}
          onSelectFolder={setActiveFolder}
        />
      </div>
      
      {/* Contenu principal */}
      <div className="flex-1 overflow-auto pb-6 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 mt-4">
          <div className="flex-grow">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{activeFolderName}</h2>
                <button
                  onClick={() => setActiveFolder(null)}
                  className={`ml-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ${activeFolder === null ? 'hidden' : ''}`}
                >
                  See all
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {activeFolder === null
                  ? 'Manage all your authentication codes'
                  : `Manage codes in the "${activeFolderName}" folder`
                }
              </p>
            </div>
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={handleQuickCreateFolder}
                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Add folder"
              >
                <FolderPlus size={20} />
              </button>
              <VaultActions />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-sm"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add new key
          </button>
          <button
            onClick={handleQuickCreateFolder}
            className="hidden md:flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors duration-200 shadow-sm"
          >
            <FolderPlus className="w-5 h-5 mr-2" />
            Add folder
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
            <div key={entry.id} className="relative group">
              <TOTPCard 
                entry={entry}
                currentTime={currentTime}
              />
              
              {/* Menu de sélection de dossier */}
              {showFolderSelector === entry.id && (
                <div className="absolute right-2 top-12 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 p-2 min-w-[200px]">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 px-2">
                    Move to folder
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    <button
                      onClick={() => handleMoveToFolder(entry.id, null)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm ${!entry.folderId ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      Root
                    </button>
                    
                    {folders.map(folder => (
                      <button
                        key={folder.id}
                        onClick={() => handleMoveToFolder(entry.id, folder.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center ${entry.folderId === folder.id ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        <span className="mr-2" style={{ color: folder.color }}>{folder.icon || '📁'}</span>
                        {folder.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Bouton pour afficher le sélecteur de dossier */}
              <button
                onClick={() => setShowFolderSelector(showFolderSelector === entry.id ? null : entry.id)}
                className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                title="Move to folder"
              >
                <FolderPlus size={16} className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" />
              </button>
            </div>
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
    </div>
  );
};

export default AuthenticatorApp;