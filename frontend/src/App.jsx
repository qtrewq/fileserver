import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import AccountDisabled from './components/AccountDisabled';
import api from './api';

const PrivateRoute = ({ children, authConfig }) => {
  const token = localStorage.getItem('token');
  const cloudflareEnabled = authConfig?.cloudflare_enabled;
  
  if (token || cloudflareEnabled) {
    return children;
  }
  
  return <Navigate to="/login" />;
};

function App() {
  const [authConfig, setAuthConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthConfig = async () => {
      try {
        const response = await api.get('/public/auth-config');
        setAuthConfig(response.data);
      } catch (err) {
        console.error("Failed to fetch auth config:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthConfig();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/account-disabled" element={<AccountDisabled />} />
        <Route path="/reset-password" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute authConfig={authConfig}>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute authConfig={authConfig}>
              <Admin />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
