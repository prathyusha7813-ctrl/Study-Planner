import { useAuth } from '../context/AuthContext';
import AuthForm from './AuthForm';

export default function Login() {
  const { login } = useAuth();
  return <AuthForm mode="login" onSubmit={login} />;
}
