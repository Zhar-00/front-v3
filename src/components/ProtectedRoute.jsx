import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative flex items-center justify-center">
          {/* Círculo animado exterior */}
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          {/* Círculo decorativo interior */}
          <div className="absolute w-8 h-8 bg-white rounded-full shadow-soft flex items-center justify-center">
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-ping"></div>
          </div>
        </div>
        <p className="mt-4 text-slate-500 text-sm font-medium animate-pulse tracking-wide font-sans">
          Cargando entorno seguro...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
