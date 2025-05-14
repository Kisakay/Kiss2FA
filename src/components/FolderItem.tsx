import React, { useState } from 'react';
import { Folder } from '../types';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, ChevronRight, Edit, Trash2, Check, XIcon, Palette } from 'lucide-react';

interface FolderItemProps {
  folder: Folder;
  isActive: boolean;
  onSelect: (folderId: string) => void;
}

const FolderItem: React.FC<FolderItemProps> = ({ folder, isActive, onSelect }) => {
  const { updateFolder, deleteFolder } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newIcon, setNewIcon] = useState(folder.icon);

  const predefinedColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6b7280', // gray
    '#000000', // black
  ];

  const predefinedIcons = [
    '📁', '🔒', '🔑', '🏢', '🏠', '🌐', '💼', '🛒', '🏦', '💻', '📱', '🎮'
  ];

  const handleSave = () => {
    if (newName.trim()) {
      updateFolder(folder.id, { 
        name: newName.trim(),
        icon: newIcon
      });
      setIsEditing(false);
      setShowColorPicker(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setNewName(folder.name);
      setNewIcon(folder.icon);
    }
  };

  const confirmDelete = () => {
    if (window.confirm(`Are you sure you want to delete the folder "${folder.name}"? The entries will be moved to the root.`)) {
      deleteFolder(folder.id);
    }
  };

  const toggleExpanded = () => {
    updateFolder(folder.id, { isExpanded: !folder.isExpanded });
  };

  const handleColorSelect = (color: string) => {
    // Mettre à jour la couleur sans fermer le sélecteur
    updateFolder(folder.id, { color });
    // Force le re-rendu de l'interface pour voir les changements immédiatement
    setNewIcon(newIcon); // Cette ligne force un re-rendu du composant
  };

  const handleIconSelect = (icon: string) => {
    setNewIcon(icon);
  };

  return (
    <div className={`mb-1 rounded-md ${isActive ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
      <div className="flex items-center p-2 group">
        <button 
          onClick={toggleExpanded}
          className="mr-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          {folder.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {isEditing ? (
          <div className="flex-1 flex items-center">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center mr-2 cursor-pointer transition-colors"
              onClick={() => setShowColorPicker(!showColorPicker)}
              style={{ 
                backgroundColor: `${folder.color}20`, // Couleur avec opacité à 20%
                color: folder.color,
                borderLeft: `3px solid ${folder.color}`
              }}
            >
              {newIcon || '📁'}
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
              className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={handleSave}
              className="ml-1 p-1 text-green-500 hover:text-green-600 dark:text-green-400"
            >
              <Check size={16} />
            </button>
            <button 
              onClick={() => {
                setIsEditing(false);
                setNewName(folder.name);
                setNewIcon(folder.icon);
              }}
              className="p-1 text-red-500 hover:text-red-600 dark:text-red-400"
            >
              <XIcon size={16} />
            </button>
          </div>
        ) : (
          <>
            <div 
              className="flex items-center flex-1 cursor-pointer"
              onClick={() => onSelect(folder.id)}
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-2 transition-colors"
                style={{ 
                  backgroundColor: `${folder.color}20`, // Couleur avec opacité à 20%
                  color: folder.color,
                  borderLeft: `3px solid ${folder.color}`
                }}
              >
                {folder.icon || '📁'}
              </div>
              <span className="text-gray-800 dark:text-gray-200 font-medium">
                {folder.name}
              </span>
            </div>
            
            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Edit"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Change appearance"
              >
                <Palette size={14} />
              </button>
              <button
                onClick={confirmDelete}
                className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {showColorPicker && (
        <div className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-md mb-2 ml-6">
          <div className="mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Color</p>
            <div className="flex flex-wrap gap-2">
              {predefinedColors.map(color => (
                <div
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`w-6 h-6 rounded-full cursor-pointer border ${folder.color === color ? 'border-2 border-white dark:border-white ring-2 ring-blue-500' : 'border-gray-300 dark:border-gray-600'}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Icon</p>
            <div className="flex flex-wrap gap-2">
              {predefinedIcons.map(icon => (
                <div
                  key={icon}
                  onClick={() => handleIconSelect(icon)}
                  className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${newIcon === icon ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500' : ''}`}
                  style={{ color: folder.color }}
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            >
              Apply changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderItem;
