import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import AuthenticatorApp from './components/AuthenticatorApp';
import UnlockForm from './components/UnlockForm';
import { useAuth } from './context/AuthContext';

const AppContent = () => {
  const { isLocked } = useAuth();
  return isLocked ? <UnlockForm /> : <AuthenticatorApp />;
};

function App() {
  return (
    <AuthProvider>
      <Layout>
        <AppContent />
      </Layout>
    </AuthProvider>
  );
}

export default App;