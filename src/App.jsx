import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Toast from './components/Toast';

// Vistas Públicas
import LandingPage from './views/LandingPage';
import Login from './views/auth/Login';
import Register from './views/auth/Register';
import ForgotPassword from './views/auth/ForgotPassword';

// Vistas Privadas
import Dashboard from './views/portal/Dashboard';
import RequestWizard from './views/portal/RequestWizard';
import RequestTracking from './views/portal/RequestTracking';
import PaymentView from './views/portal/PaymentView';
import Profile from './views/portal/Profile';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toast />
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Rutas Protegidas (Requieren Login) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/wizard" element={<Layout><RequestWizard /></Layout>} />
            <Route path="/tracking/:id" element={<Layout><RequestTracking /></Layout>} />
            <Route path="/payments" element={<Layout><PaymentView /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
