import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pb_token'));
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  api.interceptors.request.use((config) => {
    const currentToken = localStorage.getItem('pb_token');
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  };

  const verifyOTP = async (email, otp, purpose = 'login') => {
    const response = await api.post('/auth/verify-otp', { email, otp, purpose });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('pb_token', newToken);
    setToken(newToken);
    setUser(userData);
    return response.data;
  };

  const requestOTP = async (email, purpose) => {
    const response = await api.post('/auth/request-otp', { email, purpose });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('pb_token');
    setToken(null);
    setUser(null);
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        verifyOTP,
        requestOTP,
        logout,
        register,
        api,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
