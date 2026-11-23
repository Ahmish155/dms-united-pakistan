import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { IUser } from '@dms/shared';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: IUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('dms_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('dms_token');
      if (storedToken) {
        try {
          const userData = await ApiService.get<IUser>('/auth/me');
          setUser(userData);
        } catch (err) {
          console.warn('Session expired or invalid:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, newUser: IUser) => {
    localStorage.setItem('dms_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('dms_token');
    localStorage.removeItem('dms_active_workspace_id');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
