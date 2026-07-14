import React, { createContext, useContext, useEffect, useState } from 'react';
import API from '../services/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  customCategories?: string[];
  monthlyBudget?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateBudget: (budget: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clear previous errors helper
  const clearError = () => setError(null);

  // Initialize and check current user on application startup
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await API.get('/auth/me');
        setUser(response.data);
      } catch (err: any) {
        console.error('Failed to verify token on boot:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  // Login handler
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.post('/auth/login', { email, password });
      const { token: userToken, ...userData } = response.data;
      
      localStorage.setItem('token', userToken);
      setToken(userToken);
      setUser(userData);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Sign up handler
  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.post('/auth/register', { name, email, password });
      const { token: userToken, ...userData } = response.data;

      localStorage.setItem('token', userToken);
      setToken(userToken);
      setUser(userData);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed. Try a different email.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  // Refresh user details (to get updated customCategories)
  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await API.get('/auth/me');
      setUser(response.data);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  // Update budget handler
  const updateBudget = async (budget: number) => {
    try {
      const response = await API.put('/auth/budget', { budget });
      setUser(response.data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update budget.';
      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        signup,
        logout,
        clearError,
        refreshUser,
        updateBudget,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
