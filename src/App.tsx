import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import AuthenticatorApp from './components/AuthenticatorApp';
import UnlockForm from './components/UnlockForm';
import LoginForm from './components/LoginForm';
import { useAuth } from './context/AuthContext';
import { useEffect, useState } from 'react';
import { Config } from './utils/config';
import { loadConfig } from './utils/config';

const AppContent = () => {
  const { isAuthenticated, isLocked, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex overflow-auto items-center justify-center p-4">
        <LoginForm />
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {isLocked ? (
        <UnlockForm />
      ) : (
        <AuthenticatorApp />
      )}
    </div>
  );
};

function App() {
  // Initialize configuration
  const [, setCfg] = useState<Config | null>(null);
  
  useEffect(() => {
    loadConfig().then(setCfg);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <AppContent />
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;