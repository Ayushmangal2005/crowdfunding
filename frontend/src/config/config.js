// Environment configuration
const config = {
  // API URLs
  API_BASE_URL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000'),
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000'),
  
  // App settings
  APP_NAME: import.meta.env.VITE_APP_NAME || 'FundFlow',
  
  // Feature flags
  ENABLE_CHAT: import.meta.env.VITE_ENABLE_CHAT !== 'false',
  ENABLE_SOCKETS: import.meta.env.VITE_ENABLE_SOCKETS !== 'false',
};

export default config; 