import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  fullName: string;
  roles: string[];
  assignedStoreId?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Validate token and get user data
      validateTokenAndGetUser();
    } else {
      setLoading(false);
    }
  }, []);

  const validateTokenAndGetUser = async () => {
    try {
      // Get user profile to validate token and get user data
      const userProfile = await api.getUserProfile();
      const userData = {
        id: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.fullName,
        roles: userProfile.roles || [],
        assignedStoreId: userProfile.assignedStoreId
      };
      setUser(userData);
    } catch (error) {
      console.error('Token validation failed:', error);
      // Token is invalid, remove it
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', email);
      const response = await api.login(email, password);
      console.log('Login response:', response);
      
      localStorage.setItem('authToken', response.accessToken);
      const userData = {
        id: response.user.id,
        email: response.user.email,
        fullName: response.user.fullName,
        roles: response.user.roles || [],
        assignedStoreId: response.user.assignedStoreId
      };
      console.log('Setting user data:', userData);
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      console.log('Attempting registration with:', userData.email);
      const response = await api.register(userData);
      console.log('Registration response:', response);
      // Registration successful, but user needs to login separately
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
