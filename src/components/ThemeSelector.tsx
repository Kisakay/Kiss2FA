import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeSelector: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get the appropriate icon based on the current theme
  const getThemeIcon = () => {
    // For system theme, show the actual resolved theme icon (sun or moon)
    if (theme === 'system') {
      return resolvedTheme === 'dark' ? 
        <Moon className="w-5 h-5" /> : 
        <Sun className="w-5 h-5" />;
    }
    
    // For explicit themes, show their respective icons
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        aria-label="Toggle theme"
        title="Change theme"
      >
        {getThemeIcon()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10 overflow-hidden transition-all duration-200">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => {
                setTheme('light');
                setIsOpen(false);
              }}
              className={`flex items-center w-full px-4 py-2 text-sm transition-colors duration-200 ${
                theme === 'light'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              role="menuitem"
            >
              <Sun className="w-4 h-4 mr-2" />
              Light
              {theme === 'light' && (
                <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
              )}
            </button>
            
            <button
              onClick={() => {
                setTheme('dark');
                setIsOpen(false);
              }}
              className={`flex items-center w-full px-4 py-2 text-sm transition-colors duration-200 ${
                theme === 'dark'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              role="menuitem"
            >
              <Moon className="w-4 h-4 mr-2" />
              Dark
              {theme === 'dark' && (
                <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
              )}
            </button>
            
            <button
              onClick={() => {
                setTheme('system');
                setIsOpen(false);
              }}
              className={`flex items-center w-full px-4 py-2 text-sm transition-colors duration-200 ${
                theme === 'system'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              role="menuitem"
            >
              <Monitor className="w-4 h-4 mr-2" />
              System
              {theme === 'system' && (
                <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
