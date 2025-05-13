import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import AuthenticatorApp from './components/AuthenticatorApp';
import UnlockForm from './components/UnlockForm';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { useState } from 'react';
import { Config } from './utils/config';
import { loadConfig } from './utils/config';

const AppContent = () => {
  const { isLocked } = useAuth();
  return isLocked ? <UnlockForm /> : <AuthenticatorApp />;
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