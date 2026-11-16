import { useAuth } from '../context/AuthContext';
import AuthForm from './AuthForm';

export default function Register() {
  const { register } = useAuth();
  return <AuthForm mode="register" onSubmit={register} />;
}
