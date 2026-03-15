import { useContext } from 'react';
import { SnackbarContext } from '../context/SnackbarContext';

// Centralized error handling utility
export const handleApiError = (error, customMessage = null) => {
  console.error('API Error:', error);
  
  let message = customMessage;
  
  if (!message) {
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          message = 'Bad request. Please check your input.';
          break;
        case 401:
          message = 'Unauthorized. Please login again.';
          break;
        case 403:
          message = 'Access denied. You don\'t have permission for this action.';
          break;
        case 404:
          message = 'Resource not found.';
          break;
        case 409:
          message = 'Conflict. This resource already exists.';
          break;
        case 422:
          message = 'Validation error. Please check your input.';
          break;
        case 429:
          message = 'Too many requests. Please try again later.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        default:
          message = 'An unexpected error occurred. Please try again.';
      }
    } else if (error.message) {
      message = error.message;
    } else {
      message = 'An unexpected error occurred. Please try again.';
    }
  }
  
  return message;
};

// Hook for using error handling with snackbar
export const useErrorHandler = () => {
  const snackbar = useContext(SnackbarContext);
  
  const handleError = (error, customMessage = null) => {
    const message = handleApiError(error, customMessage);
    if (snackbar) {
      snackbar.showError(message);
    }
  };
  
  return { handleError };
};

// Validation error handler
export const handleValidationError = (errors) => {
  if (typeof errors === 'string') {
    return errors;
  }
  
  if (Array.isArray(errors)) {
    return errors.join(', ');
  }
  
  if (typeof errors === 'object') {
    return Object.values(errors).join(', ');
  }
  
  return 'Validation failed. Please check your input.';
};

// Network error handler
export const handleNetworkError = (error) => {
  if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
    return 'Network error. Please check your internet connection.';
  }
  
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }
  
  return 'Connection error. Please try again.';
};

// Email validation utility
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Form validation helper
export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const fieldRules = rules[field];
    
    if (fieldRules.required && (!value || value.trim() === '')) {
      errors[field] = `${fieldRules.label || field} is required`;
    } else if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `${fieldRules.label || field} must be at least ${fieldRules.minLength} characters`;
    } else if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `${fieldRules.label || field} must be no more than ${fieldRules.maxLength} characters`;
    } else if (value && fieldRules.pattern && !fieldRules.pattern.test(value)) {
      errors[field] = fieldRules.message || `${fieldRules.label || field} format is invalid`;
    } else if (value && fieldRules.custom) {
      const customError = fieldRules.custom(value, formData);
      if (customError) {
        errors[field] = customError;
      }
    }
  });
  
  return errors;
}; 