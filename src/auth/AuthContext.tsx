import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  avatar?: string;
  createdAt: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  verifyEmail: (otp: string) => Promise<void>;
  resendOTP: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (otp: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (token && userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('token') && !!localStorage.getItem('user');
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login(email, password);
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.signup(name, email, password);
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Call backend logout (optional, can be skipped for JWT)
    authAPI.logout().catch(console.error);
    
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const verifyEmail = async (otp: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.verifyEmail(otp);
      
      if (response.success) {
        // Update user in state and localStorage
        if (user) {
          const updatedUser = { ...user, emailVerified: true };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.resendOTP();
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to resend OTP');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend OTP';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.forgotPassword(email);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to send reset code');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset code';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (otp: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!user) {
        throw new Error('User not found');
      }
      
      const response = await authAPI.resetPassword(user.email, otp, newPassword);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Call backend to update profile
      authAPI.updateProfile(data).catch(console.error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        signup,
        logout,
        verifyEmail,
        resendOTP,
        forgotPassword,
        resetPassword,
        clearError,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
