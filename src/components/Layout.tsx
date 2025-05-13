import React from 'react';
import { ShieldCheck } from 'lucide-react';
import ThemeSelector from './ThemeSelector';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Kiss2FA</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        {children}
      </main>
      
      <footer className="py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Kiss2FA. Your data is stored locally and encrypted.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout