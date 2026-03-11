# Error Handling System

This document describes the comprehensive error handling system implemented in the FundFlow crowdfunding platform.

## Overview

The error handling system consists of several components working together to provide a consistent and user-friendly error experience:

1. **Snackbar Component** - Custom notification system
2. **SnackbarContext** - Global state management for notifications
3. **ErrorBoundary** - React error boundary for catching component errors
4. **Error Handler Utilities** - Centralized error handling functions
5. **LoadingSpinner** - Consistent loading states

## Components

### Snackbar Component (`src/components/Snackbar.jsx`)

A custom notification component that replaces `react-hot-toast` with better styling and control.

**Features:**
- Multiple notification types (success, error, warning, info)
- Customizable duration
- Smooth animations
- Manual close functionality
- Responsive design

**Usage:**
```jsx
import Snackbar from '../components/Snackbar';

<Snackbar 
  message="Operation successful!" 
  type="success" 
  duration={5000} 
  onClose={() => setVisible(false)} 
/>
```

### SnackbarContext (`src/context/SnackbarContext.jsx`)

Global context for managing notifications across the application.

**Available Methods:**
- `showSnackbar(message, type, duration)` - Show any type of notification
- `showSuccess(message, duration)` - Show success notification
- `showError(message, duration)` - Show error notification
- `showWarning(message, duration)` - Show warning notification
- `showInfo(message, duration)` - Show info notification

**Usage:**
```jsx
import { useSnackbar } from '../context/SnackbarContext';

const { showSuccess, showError } = useSnackbar();

// Show success message
showSuccess('Operation completed successfully!');

// Show error message
showError('Something went wrong. Please try again.');
```

### ErrorBoundary (`src/components/ErrorBoundary.jsx`)

React error boundary that catches JavaScript errors anywhere in the component tree.

**Features:**
- Catches React component errors
- Provides user-friendly error UI
- Shows error details in development
- Options to refresh page or go home
- Integrates with snackbar for notifications

**Usage:**
```jsx
import ErrorBoundary from '../components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### Error Handler Utilities (`src/utils/errorHandler.js`)

Centralized error handling functions for consistent error management.

**Available Functions:**

#### `handleApiError(error, customMessage)`
Processes API errors and returns appropriate error messages.

```jsx
import { handleApiError } from '../utils/errorHandler';

const errorMessage = handleApiError(error, 'Custom error message');
```

#### `useErrorHandler()`
Hook that combines error handling with snackbar notifications.

```jsx
import { useErrorHandler } from '../utils/errorHandler';

const { handleError } = useErrorHandler();

try {
  await apiCall();
} catch (error) {
  handleError(error, 'Custom error message');
}
```

#### `validateForm(formData, rules)`
Validates form data against defined rules.

```jsx
import { validateForm } from '../utils/errorHandler';

const validationErrors = validateForm(formData, {
  email: { 
    required: true, 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email'
  },
  password: { 
    required: true, 
    minLength: 6 
  }
});
```

#### `handleValidationError(errors)`
Processes validation errors into user-friendly messages.

```jsx
import { handleValidationError } from '../utils/errorHandler';

const errorMessage = handleValidationError(validationErrors);
```

#### `handleNetworkError(error)`
Handles network-related errors.

```jsx
import { handleNetworkError } from '../utils/errorHandler';

const networkErrorMessage = handleNetworkError(error);
```

### LoadingSpinner (`src/components/LoadingSpinner.jsx`)

Consistent loading component for better UX.

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `text`: Loading message
- `fullScreen`: Boolean for full-screen loading
- `className`: Additional CSS classes

**Usage:**
```jsx
import LoadingSpinner from '../components/LoadingSpinner';

// Full-screen loading
<LoadingSpinner fullScreen text="Loading dashboard..." />

// Inline loading
<LoadingSpinner size="sm" text="Saving..." />
```

## Best Practices

### 1. Error Handling in Components

Always wrap API calls in try-catch blocks and use the error handling utilities:

```jsx
import { useErrorHandler } from '../utils/errorHandler';
import { useSnackbar } from '../context/SnackbarContext';

const MyComponent = () => {
  const { handleError } = useErrorHandler();
  const { showSuccess } = useSnackbar();

  const handleSubmit = async () => {
    try {
      await apiCall();
      showSuccess('Operation successful!');
    } catch (error) {
      handleError(error, 'Custom error message');
    }
  };
};
```

### 2. Form Validation

Use the validation utilities for consistent form validation:

```jsx
import { validateForm } from '../utils/errorHandler';

const handleSubmit = (e) => {
  e.preventDefault();
  
  const errors = validateForm(formData, {
    email: { 
      required: true, 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email'
    },
    password: { 
      required: true, 
      minLength: 6 
    }
  });

  if (Object.keys(errors).length > 0) {
    showError(Object.values(errors).join(', '));
    return;
  }

  // Proceed with form submission
};
```

### 3. Loading States

Use the LoadingSpinner component for consistent loading states:

```jsx
import LoadingSpinner from '../components/LoadingSpinner';

if (loading) {
  return <LoadingSpinner fullScreen text="Loading..." />;
}
```

### 4. Error Boundaries

Wrap your main app or critical components with ErrorBoundary:

```jsx
import ErrorBoundary from '../components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Migration from react-hot-toast

The system has been migrated from `react-hot-toast` to the custom snackbar system. Here's what changed:

### Before:
```jsx
import toast from 'react-hot-toast';

toast.success('Success message');
toast.error('Error message');
```

### After:
```jsx
import { useSnackbar } from '../context/SnackbarContext';

const { showSuccess, showError } = useSnackbar();

showSuccess('Success message');
showError('Error message');
```

## Error Types and Status Codes

The system handles various HTTP status codes with appropriate messages:

- **400**: Bad request - "Bad request. Please check your input."
- **401**: Unauthorized - "Unauthorized. Please login again."
- **403**: Forbidden - "Access denied. You don't have permission for this action."
- **404**: Not found - "Resource not found."
- **409**: Conflict - "Conflict. This resource already exists."
- **422**: Validation error - "Validation error. Please check your input."
- **429**: Too many requests - "Too many requests. Please try again later."
- **500**: Server error - "Server error. Please try again later."

## Development vs Production

In development mode, the ErrorBoundary shows detailed error information for debugging. In production, it shows a user-friendly error message without exposing sensitive information.

## Future Enhancements

1. **Error Reporting**: Integrate with error reporting services like Sentry
2. **Analytics**: Track error occurrences for monitoring
3. **Retry Logic**: Implement automatic retry for failed requests
4. **Offline Support**: Handle network connectivity issues
5. **Internationalization**: Support for multiple languages in error messages 