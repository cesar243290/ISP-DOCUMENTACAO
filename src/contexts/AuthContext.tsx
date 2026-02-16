import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { verifyPassword } from '../lib/auth';
import { logAudit } from '../lib/audit';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        setLoading(false);
        return;
      }

      const { data: session } = await supabase
        .from('sessions')
        .select('user_id, expires_at')
        .eq('token', sessionToken)
        .single();

      if (!session || new Date(session.expires_at) < new Date()) {
        localStorage.removeItem('session_token');
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user_id)
        .single();

      if (userData && userData.is_active) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !userData) {
        await logAudit({
          action: 'LOGIN_FAILED',
          entity_type: 'user',
          after_data: { email }
        });
        throw new Error('Credenciais inválidas');
      }

      const isValid = await verifyPassword(password, userData.password_hash);

      if (!isValid) {
        await logAudit({
          user_id: userData.id,
          action: 'LOGIN_FAILED',
          entity_type: 'user',
          entity_id: userData.id
        });
        throw new Error('Credenciais inválidas');
      }

      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8);

      await supabase.from('sessions').insert({
        user_id: userData.id,
        token: sessionToken,
        expires_at: expiresAt.toISOString()
      });

      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      await logAudit({
        user_id: userData.id,
        action: 'LOGIN_SUCCESS',
        entity_type: 'user',
        entity_id: userData.id
      });

      localStorage.setItem('session_token', sessionToken);
      setUser(userData);
      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (sessionToken) {
        await supabase.from('sessions').delete().eq('token', sessionToken);
      }

      if (user) {
        await logAudit({
          user_id: user.id,
          action: 'LOGOUT',
          entity_type: 'user',
          entity_id: user.id
        });
      }

      localStorage.removeItem('session_token');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
