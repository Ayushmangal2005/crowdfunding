import React, { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from '../components/Snackbar';

export const SnackbarContext = createContext();

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    console.warn('useSnackbar must be used within a SnackbarProvider');
    return {
      showSnackbar: () => {},
      showSuccess: () => {},
      showError: () => {},
      showWarning: () => {},
      showInfo: () => {},
    };
  }
  return context;
};

export const SnackbarProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showSnackbar = useCallback((message, type = 'info', duration = 2000) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      message,
      type,
      duration,
    };
    
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const hideSnackbar = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showSuccess = useCallback((message, duration) => {
    showSnackbar(message, 'success', duration);
  }, [showSnackbar]);

  const showError = useCallback((message, duration) => {
    showSnackbar(message, 'error', duration);
  }, [showSnackbar]);

  const showWarning = useCallback((message, duration) => {
    showSnackbar(message, 'warning', duration);
  }, [showSnackbar]);

  const showInfo = useCallback((message, duration) => {
    showSnackbar(message, 'info', duration);
  }, [showSnackbar]);

  const value = {
    showSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {notifications.map(notification => (
        <Snackbar
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => hideSnackbar(notification.id)}
        />
      ))}
    </SnackbarContext.Provider>
  );
}; 