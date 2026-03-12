import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'ADMIN' | 'NOC' | 'VIEWER';
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
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
      const token = localStorage.getItem('session_token');
      if (token) {
        const { data: session } = await supabase
          .from('sessions')
          .select('user_id')
          .eq('token', token)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (session?.user_id) {
          await loadUserProfile(session.user_id);
        } else {
          localStorage.removeItem('session_token');
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      localStorage.removeItem('session_token');
    } finally {
      setLoading(false);
    }
  }

  async function loadUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, is_active')
        .eq('id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUser(data as User);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async function login(username: string, password: string) {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, username, password_hash, role, is_active, full_name')
        .or(`username.eq.${username},email.eq.${username}`)
        .eq('is_active', true)
        .maybeSingle();

      if (userError || !userData) {
        throw new Error('Usuário ou senha inválidos');
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hashHex !== userData.password_hash) {
        throw new Error('Usuário ou senha inválidos');
      }

      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: userData.id,
          token: token,
          expires_at: expiresAt.toISOString(),
          ip_address: null,
          user_agent: navigator.userAgent
        });

      if (sessionError) throw sessionError;

      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      localStorage.setItem('session_token', token);

      setUser({
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        is_active: userData.is_active
      });

      navigate('/dashboard');
    } catch (error: any) {
      throw new Error(error.message || 'Falha no login');
    }
  }

  async function logout() {
    try {
      const token = localStorage.getItem('session_token');
      if (token) {
        await supabase
          .from('sessions')
          .delete()
          .eq('token', token);
      }

      localStorage.removeItem('session_token');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('session_token');
      setUser(null);
      navigate('/login');
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
