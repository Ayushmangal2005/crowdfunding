import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SnackbarProvider } from './context/SnackbarContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateCampaign from './pages/CreateCampaign';
import CampaignDetails from './pages/CampaignDetails';
import AdminDashboard from './pages/AdminDashboard';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import EditCampaign from './pages/EditCampaign';
import Subscription from './pages/Subscription';


function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  console.log('Private route accessed:', user, 'loading:', loading);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}


function SubscriptionRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !['investor', 'startup'].includes(user.role)) return children;

  const sub = user.subscription;
  const hasActiveSub = sub?.status === 'active' && sub?.endDate && new Date(sub.endDate) > new Date();

  return hasActiveSub ? children : <Navigate to="/subscribe" />;
}

function AdminRoute({ children }) {
  console.log('Admin route check initiated');
  const { user, loading } = useAuth();
  console.log('Admin route accessed:', user, 'loading:', loading);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user && user.role === 'admin' ? children : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <SnackbarProvider>
      <ErrorBoundary>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } />

                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={
                      <PrivateRoute>
                        <SubscriptionRoute>
                          <Dashboard />
                        </SubscriptionRoute>
                      </PrivateRoute>
                    } />
                    <Route path="/create-campaign" element={
                      <PrivateRoute>
                        <SubscriptionRoute>
                          <CreateCampaign />
                        </SubscriptionRoute>
                      </PrivateRoute>
                    } />
                    <Route path="/campaign/:id" element={
                      <PrivateRoute>
                        <SubscriptionRoute>
                          <CampaignDetails />
                        </SubscriptionRoute>
                      </PrivateRoute>
                    } />
                    <Route path="/edit-campaign/:id" element={<PrivateRoute><EditCampaign /></PrivateRoute>} />
                    <Route path="/chat" element={
                      <PrivateRoute>
                        <SubscriptionRoute>
                          <Chat />
                        </SubscriptionRoute>
                      </PrivateRoute>
                    } />
                    <Route path="/profile" element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    } />
                    <Route path="/subscribe" element={
                      <PrivateRoute>
                        <Subscription />
                      </PrivateRoute>
                    } />
                    

                  </Routes>
                </main>
              </div>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SnackbarProvider>
  );
}

export default App;