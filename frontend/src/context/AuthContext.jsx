import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { SnackbarContext } from './SnackbarContext';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  console.log('Auth context accessed:', context);
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const snackbar = useContext(SnackbarContext);

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    const token = localStorage.getItem('token');
    console.log('AuthContext: Token found:', !!token);
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      console.log('AuthContext: No token, setting loading to false');
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      console.log('AuthContext: Fetching user data...');
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/auth/me`);
      console.log('AuthContext: User data received:', response.data);
      setUser(response.data);
    } catch (error) {
      console.log('AuthContext: Error fetching user:', error.response?.data);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      console.log('AuthContext: Setting loading to false');
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/auth/login`, {
        email,
        password,
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      if (snackbar) {
        snackbar.showSuccess('Login successful!');
      }
      return true;
    } catch (error) {
      if (snackbar) {
        snackbar.showError(error.response?.data?.message || 'Login failed');
      }
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/auth/register`, userData);
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      if (snackbar) {
        snackbar.showSuccess('Registration successful!');
      }
      return true;
    } catch (error) {
      if (snackbar) {
        snackbar.showError(error.response?.data?.message || 'Registration failed');
      }
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    if (snackbar) {
      snackbar.showSuccess('Logged out successfully');
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    fetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};