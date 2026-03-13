import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { Server, Moon, Sun } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast, ToastContainer } = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
    } catch (error: any) {
      showToast(error.message || 'Erro ao fazer login', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      {ToastContainer}
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 relative">
          <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          <div className="flex justify-center mb-8">
            <div className="bg-blue-600 dark:bg-blue-500 p-4 rounded-2xl">
              <Server className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
            ISP NOC System
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Network Operations Center
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoFocus
            />

            <Input
              type="password"
              label="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Sistema de Gestão de Rede ISP/NOC
        </p>
      </div>
    </div>
  );
}
