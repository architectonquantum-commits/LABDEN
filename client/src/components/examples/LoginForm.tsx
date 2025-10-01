import { LoginForm } from '../LoginForm';

export default function LoginFormExample() {
  const handleLogin = (email: string, password: string, role: string) => {
    console.log('Login:', { email, role });
  };

  return <LoginForm onLogin={handleLogin} />;
}