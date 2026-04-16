import { AuthProvider } from '@/components/AuthContext';
import RegisterPage from './RegisterPage';

export default function Register() {
  return (
    <AuthProvider>
      <RegisterPage />
    </AuthProvider>
  );
}
