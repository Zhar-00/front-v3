import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const { recoverPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const res = await recoverPassword(email);
      setSuccessMessage(res.message || 'Se ha enviado un enlace a su correo.');
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      
      <Link to="/" className="flex items-center space-x-2.5 mb-8">
        <div className="p-2.5 bg-indigo-500 rounded-xl text-white shadow-soft">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-slate-900">SIGESTO</span>
      </Link>

      <div className="w-full max-w-md bg-white border border-slate-200/60 rounded-3xl p-8 shadow-soft">
        <div className="text-left mb-6">
          <h2 className="font-display font-bold text-2xl text-slate-900">Recuperar Contraseña</h2>
          <p className="text-xs text-slate-400 mt-1">Le enviaremos un correo electrónico con las instrucciones para restablecer su clave.</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-2.5 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-soft-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 text-sm">¡Correo Enviado!</h3>
              <p className="text-xs text-slate-500 leading-relaxed px-2">
                Hemos enviado un correo a <strong className="text-slate-700">{email}</strong>. Por favor, revise su bandeja de entrada (y su carpeta de correo no deseado).
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-soft w-full"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Volver a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl shadow-soft transition-soft hover-lift cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Procesando...
                </span>
              ) : (
                'Enviar Enlace de Recuperación'
              )}
            </button>

            <div className="text-center pt-2">
              <Link 
                to="/login" 
                className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-indigo-500 transition-soft mt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a Iniciar Sesión
              </Link>
            </div>
          </form>
        )}
      </div>

      <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl max-w-sm text-center">
        <p className="text-[10px] text-indigo-600 leading-normal">
          <strong>Tip Demo:</strong> Puedes usar <span className="font-mono">daniela.alva@gmail.com</span> para emular una recuperación exitosa.
        </p>
      </div>

    </div>
  );
};

export default ForgotPassword;
