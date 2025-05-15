import React, { useState, useEffect, useRef } from 'react';
import { generateTOTP, getTimeRemaining } from '../utils/totp';
import { TOTPEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { Copy, Edit, Trash2, Check, XIcon as Icons, AlertTriangle } from 'lucide-react';
import IconSelector from './IconSelector';

interface TOTPCardProps {
  entry: TOTPEntry;
  currentTime: number;
}

const TOTPCard: React.FC<TOTPCardProps> = ({ entry, currentTime }) => {
  const { updateEntry, deleteEntry } = useAuth();
  const [code, setCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(entry.name);
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Référence pour détecter les clics en dehors du menu de confirmation
  const deleteConfirmRef = useRef<HTMLDivElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  
  // Fermer le menu de confirmation lorsque l'utilisateur clique en dehors
  useEffect(() => {
    if (!showDeleteConfirm) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (deleteConfirmRef.current && 
          !deleteConfirmRef.current.contains(event.target as Node) &&
          deleteButtonRef.current &&
          !deleteButtonRef.current.contains(event.target as Node)) {
        setShowDeleteConfirm(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeleteConfirm]);

  useEffect(() => {
    const updateCode = async () => {
      // Generate the TOTP code
      const newCode = await generateTOTP(entry.secret, entry.period, entry.digits);
      setCode(newCode);
    };
    updateCode();

    // Calculate time remaining until next refresh
    const remaining = getTimeRemaining(entry.period);
    setTimeRemaining(remaining);
  }, [entry, currentTime]);

  // Format code with space in the middle for readability
  const formattedCode = code.length === 6
    ? `${code.substring(0, 3)} ${code.substring(3)}`
    : code;

  const copyToClipboard = () => {
    // Vérifie si nous sommes en HTTPS ou localhost (contexte sécurisé)
    const isSecureContext = window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    // Méthode compatible avec HTTP et HTTPS
    const copyWithFallback = () => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        // Rendre l'élément invisible mais accessible
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);

        // Sélectionner et copier le texte
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          console.error('Failed to copy with execCommand');
          throw new Error('execCommand copy failed');
        }
      } catch (err) {
        console.error('Fallback copy method failed:', err);
        alert('Failed to copy code to clipboard');
      }
    };

    // Essayer d'abord l'API moderne si nous sommes dans un contexte sécurisé
    if (isSecureContext && navigator.clipboard) {
      navigator.clipboard.writeText(code)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          // Si l'API moderne échoue, utiliser la méthode de secours
          copyWithFallback();
        });
    } else {
      // Utiliser directement la méthode de secours en contexte non sécurisé
      copyWithFallback();
    }
  };

  const handleSave = () => {
    if (newName.trim()) {
      updateEntry(entry.id, { name: newName.trim() });
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };
  
  const handleDelete = () => {
    deleteEntry(entry.id);
    setShowDeleteConfirm(false);
  };

  const changeIcon = (icon: string) => {
    updateEntry(entry.id, { icon });
    setShowIconSelector(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowIconSelector(true)}
              className={`w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 rounded-full transition-colors relative overflow-hidden ${entry.icon && entry.icon.startsWith('data:image') ? '' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              {entry.icon ? (
                entry.icon.startsWith('data:image') ? (
                  <img src={entry.icon} alt="Custom icon" className="w-full h-full object-cover object-center absolute inset-0" />
                ) : (
                  <span className="text-lg">{entry.icon}</span>
                )
              ) : (
                <Icons className="w-5 h-5" />
              )}
            </button>

            {isEditing ? (
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                autoFocus
                className="font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h3 className="font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
                {entry.name}
              </h3>
            )}
          </div>

          <div className="flex space-x-1 mr-6"> {/* Ajout de marge à droite pour faire de la place au bouton de dossier */}
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
              title="Edit"
            >
              <Edit size={16} />
            </button>
            <button
              ref={deleteButtonRef}
              onClick={confirmDelete}
              className={`p-1 transition-colors ${showDeleteConfirm ? 'text-red-500 dark:text-red-400' : 'text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400'}`}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mt-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-2xl tracking-wider text-gray-900 dark:text-white">
              {formattedCode}
            </p>
            <button
              onClick={copyToClipboard}
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
              style={{ width: `${(timeRemaining / (entry.period || 30)) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">
            Refreshes in {timeRemaining}s
          </p>
        </div>
      </div>

      {showIconSelector && (
        <div className="z-50">
          <IconSelector
            onSelect={changeIcon}
            onClose={() => setShowIconSelector(false)}
          />
        </div>
      )}
      
      {/* Menu de confirmation de suppression */}
      {showDeleteConfirm && (
        <>
          {/* Overlay avec effet de flou */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"></div>
          
          {/* Modal de confirmation */}
          <div 
            ref={deleteConfirmRef}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 w-[90%] max-w-[400px]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Confirm deletion</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete <span className="font-medium">{entry.name}</span>? This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 dark:hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TOTPCard;