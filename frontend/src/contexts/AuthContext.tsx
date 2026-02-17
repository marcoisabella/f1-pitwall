import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface AuthUser {
  id: number;
  username: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('f1_token'));
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('f1_token'));

  // Validate existing token on mount
  useEffect(() => {
    if (!token) return;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('f1_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Login failed');
    }
    const { access_token } = await res.json();
    localStorage.setItem('f1_token', access_token);
    setToken(access_token);

    const meRes = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    setUser(await meRes.json());
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Registration failed');
    }
    const { access_token } = await res.json();
    localStorage.setItem('f1_token', access_token);
    setToken(access_token);

    const meRes = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    setUser(await meRes.json());
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('f1_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
