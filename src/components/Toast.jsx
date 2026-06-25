import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const newToast = {
        id: Date.now(),
        type: event.detail.type || 'info', // 'success', 'error', 'info', 'warning'
        message: event.detail.message,
      };
      
      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        removeToast(newToast.id);
      }, 4000);
    };

    window.addEventListener('api-toast', handleToast);
    return () => window.removeEventListener('api-toast', handleToast);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let bgClass = 'bg-white border-slate-200';
        let textClass = 'text-slate-800';
        let iconClass = 'text-indigo-500';

        if (toast.type === 'error') {
          Icon = AlertCircle;
          bgClass = 'bg-rose-50 border-rose-200';
          textClass = 'text-rose-800';
          iconClass = 'text-rose-500';
        } else if (toast.type === 'success') {
          Icon = CheckCircle;
          bgClass = 'bg-emerald-50 border-emerald-200';
          textClass = 'text-emerald-800';
          iconClass = 'text-emerald-500';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          bgClass = 'bg-amber-50 border-amber-200';
          textClass = 'text-amber-800';
          iconClass = 'text-amber-500';
        }

        return (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-start p-4 border rounded-2xl shadow-soft-lg w-80 animate-fade-in-down transition-all ${bgClass}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mr-3 mt-0.5 ${iconClass}`} />
            <div className={`flex-1 text-sm font-medium ${textClass}`}>
              {toast.message}
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className={`p-1 ml-3 rounded-lg hover:bg-black/5 opacity-50 hover:opacity-100 transition-soft ${textClass}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const showToast = (message, type = 'info') => {
  window.dispatchEvent(new CustomEvent('api-toast', { detail: { message, type } }));
};

export default Toast;
