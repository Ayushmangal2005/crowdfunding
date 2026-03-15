import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import App from './App.jsx';
import './index.css';

// In production, use the deployed backend URL. In dev, use Vite proxy (relative URLs).
if (import.meta.env.PROD) {
  axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);