import { AuthProvider } from '@/components/AuthContext';
import LoginPage from './LoginPage';

export default function Login() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}
