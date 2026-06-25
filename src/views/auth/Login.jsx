import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(redirect);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50 flex flex-col items-center justify-center p-4 font-sans animate-fade-in relative overflow-hidden">
      
      {/* Background Decorators */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Brand logo at the top */}
      <Link to="/" className="flex items-center space-x-2.5 mb-8 relative z-10">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl text-white shadow-soft hover-lift">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <span className="font-display font-bold text-2xl tracking-tight text-slate-900 drop-shadow-sm">SIGESTO</span>
      </Link>

      {/* Main card */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-soft-lg relative z-10 animate-slide-up">
        <div className="text-left mb-6">
          <h2 className="font-display font-bold text-2xl text-slate-900">Bienvenido de vuelta</h2>
          <p className="text-xs text-slate-400 mt-1">Accede al portal de gestión técnica para clientes de SIGESTO.</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-2.5 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-[50%] -translate-y-[50%] w-4.5 h-4.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-soft"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600">Contraseña</label>
              <Link 
                to="/forgot-password" 
                className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 transition-soft"
              >
                ¿Olvidó su contraseña?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-[50%] -translate-y-[50%] w-4.5 h-4.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-soft"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl shadow-soft transition-soft hover-lift cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              <>
                Ingresar al Portal <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>

        {/* Footer info inside card */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            ¿Aún no tienes cuenta?{' '}
            <Link 
              to="/register" 
              className="font-bold text-indigo-500 hover:text-indigo-600 transition-soft"
            >
              Regístrate ahora
            </Link>
          </p>
        </div>
      </div>
      
    </div>
  );
};

export default Login;
