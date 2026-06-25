import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  PlusCircle, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  ArrowRight,
  User,
  Activity,
  CreditCard,
  MapPin,
  FileText
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoadingId, setCancelLoadingId] = useState(null);
  const [dashboardError, setDashboardError] = useState(null);

  const fetchRequests = async () => {
    try {
      const data = await api.requests.getAll();
      setRequests(data);
      setDashboardError(null);
    } catch (err) {
      console.error('Error fetching requests:', err);
      const debugInfo = `[Debug Info - HTTP: ${err.status || 'N/A'}, Msg: ${err.message}]`;
      if (err.isTemporaryUnavailable || err.isUnsupported) {
        setDashboardError(`No se pudo cargar el historial de solicitudes. El servicio no está disponible en este momento. ${debugInfo}`);
      } else {
        setDashboardError(`${err.message || 'Error al conectar con el servidor.'} ${debugInfo}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('¿Está seguro de que desea anular esta solicitud técnica?')) return;
    
    setCancelLoadingId(requestId);
    try {
      await api.requests.cancel(requestId);
      await fetchRequests();
    } catch (err) {
      alert(err.message || 'Error al cancelar la solicitud');
    } finally {
      setCancelLoadingId(null);
    }
  };

  const activeCount = requests.filter(r => ['Pendiente', 'Asignado', 'En camino', 'En ejecución'].includes(r.status)).length;
  const pendingPaymentCount = requests.filter(r => r.quotation?.status === 'Aprobada').length;
  const completedCount = requests.filter(r => r.status === 'Finalizado').length;

  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('es-ES', options);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pendiente':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
            <Clock className="w-3.5 h-3.5 mr-1" /> Pendiente
          </span>
        );
      case 'Asignado':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
            <User className="w-3.5 h-3.5 mr-1" /> Asignado
          </span>
        );
      case 'En camino':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-600 border border-sky-100">
            <Activity className="w-3.5 h-3.5 mr-1 animate-pulse" /> En Camino
          </span>
        );
      case 'En ejecución':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-600 border border-purple-100">
            <Wrench className="w-3.5 h-3.5 mr-1" /> En Curso
          </span>
        );
      case 'Finalizado':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Finalizado
          </span>
        );
      case 'Cancelado':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-500 border border-rose-100">
            <XCircle className="w-3.5 h-3.5 mr-1" /> Anulado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-100">
            {status}
          </span>
        );
    }
  };

  const featuredRequest = requests.length > 0 ? requests[0] : null;
  const historyRequests = requests.length > 1 ? requests.slice(1) : [];

  const STEPPER_STAGES = [
    { id: 'PENDIENTE', label: 'Pendiente', desc: 'Revisión en oficina' },
    { id: 'ASIGNADA', label: 'Asignado', desc: 'Técnico seleccionado' },
    { id: 'COTIZADA', label: 'Cotizado', desc: 'Presupuesto listo' },
    { id: 'REVISION_PAGO', label: 'En Revisión', desc: 'Validando pago' },
    { id: 'APROBADA', label: 'Aprobado', desc: 'Adelanto confirmado' },
    { id: 'EN_PROCESO', label: 'En curso', desc: 'Reparación activa' },
    { id: 'FINALIZADA', label: 'Finalizado', desc: 'Servicio concluido' }
  ];

  let currentStageIndex = 0;
  if (featuredRequest) {
    const raw = featuredRequest.statusRaw || 'PENDIENTE';
    const foundIndex = STEPPER_STAGES.findIndex(s => s.id === raw);
    if (foundIndex !== -1) currentStageIndex = foundIndex;
    if (raw === 'CANCELADA' || raw === 'CANCELADO' || raw === 'ANULADA' || raw === 'RECHAZADA') currentStageIndex = -1;
  }

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in">
      
      {/* Cabecera de bienvenida */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-3xl p-6 md:p-8 text-white shadow-soft-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
          <Wrench className="w-72 h-72" />
        </div>
        <div className="relative z-10 space-y-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">{getFormattedDate()}</span>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl leading-tight">
              Hola, {user?.name}
            </h1>
            <p className="text-indigo-100 text-xs md:text-sm max-w-lg font-normal mt-1">
              Bienvenido a tu panel de SIGESTO. Aquí puedes ver el estado detallado de tus servicios o crear nuevas solicitudes.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 shrink-0">
            <Link 
              to="/wizard" 
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-indigo-600 hover:bg-slate-50 text-sm font-bold rounded-xl shadow-soft transition-soft hover-lift"
            >
              Nueva Solicitud <PlusCircle className="w-4.5 h-4.5 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-5 rounded-2xl shadow-soft flex items-center justify-between hover-lift">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold">Servicios Activos</span>
            <p className="text-2xl font-bold text-slate-800">{activeCount}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-5 rounded-2xl shadow-soft flex items-center justify-between hover-lift">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold">Cotizaciones Pendientes</span>
            <p className="text-2xl font-bold text-slate-800">{pendingPaymentCount}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-5 rounded-2xl shadow-soft flex items-center justify-between hover-lift">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold">Servicios Completados</span>
            <p className="text-2xl font-bold text-slate-800">{completedCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-10 text-center shadow-soft">
          <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs mt-3">Cargando historial operativo...</p>
        </div>
      ) : dashboardError ? (
        <div className="bg-white border border-rose-200/60 rounded-3xl p-12 text-center shadow-soft space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-100">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="font-bold text-slate-800 text-sm">Problema de conexión</h4>
            <p className="text-xs text-slate-400">{dashboardError}</p>
          </div>
          <button
            onClick={fetchRequests}
            className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-soft transition-soft hover-lift cursor-pointer"
          >
            Reintentar Conexión
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-12 text-center shadow-soft space-y-4">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100">
            <Wrench className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="font-bold text-slate-800 text-sm">No tienes solicitudes registradas</h4>
            <p className="text-xs text-slate-400">Crea tu primera solicitud para recibir asistencia técnica en tu domicilio.</p>
          </div>
          <Link
            to="/wizard"
            className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-soft transition-soft hover-lift"
          >
            Crear Mi Primera Solicitud <PlusCircle className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          {/* FEATURED REQUEST - DETALLE COMPLETO EN DASHBOARD */}
          <div className="bg-white/90 backdrop-blur-lg border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 flex items-center">
                  Servicio Activo
                  <span className="ml-3 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-mono tracking-wider">
                    {featuredRequest.id}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">{featuredRequest.type}</p>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(featuredRequest.status)}
                {featuredRequest.status === 'Pendiente' && (
                  <button
                    onClick={() => handleCancelRequest(featuredRequest.id)}
                    disabled={cancelLoadingId === featuredRequest.id}
                    className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 border border-red-100 rounded-lg transition-soft cursor-pointer disabled:opacity-50 flex items-center"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    {cancelLoadingId === featuredRequest.id ? 'Cancelando...' : 'Anular'}
                  </button>
                )}
              </div>
            </div>

            {/* Stepper del servicio destacado */}
            {currentStageIndex === -1 ? (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-start space-x-3 text-rose-800">
                <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Esta solicitud ha sido Anulada</h4>
                  <p className="text-xs text-rose-600 mt-1 leading-normal">
                    La solicitud fue cancelada por el cliente. Los registros quedan archivados en su historial operativo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6 relative py-4">
                {STEPPER_STAGES.map((stage, idx) => {
                  const isCompleted = idx < currentStageIndex;
                  const isActive = idx === currentStageIndex;
                  
                  return (
                    <div key={idx} className="flex md:flex-col items-center flex-1 w-full relative">
                      {idx < STEPPER_STAGES.length - 1 && (
                        <div className="hidden md:block absolute left-[50%] top-4 w-[100%] h-0.5 bg-slate-100">
                          <div 
                            className="bg-indigo-500 h-full transition-all duration-500" 
                            style={{ width: isCompleted ? '100%' : isActive ? '50%' : '0%' }}
                          ></div>
                        </div>
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-soft ${
                        isActive ? 'bg-indigo-600 text-white shadow-soft ring-4 ring-indigo-500/20' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-4.5 h-4.5" /> : idx + 1}
                      </div>
                      <div className="ml-4 md:ml-0 md:text-center mt-0 md:mt-3 text-left">
                        <h4 className={`text-xs font-bold ${isActive ? 'text-indigo-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{stage.label}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Detalles Rápidos del Servicio Activo */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Descripción del Problema</h4>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs text-slate-600 leading-relaxed">
                  {featuredRequest.description}
                </div>
                <div className="flex items-center text-xs text-slate-500 pt-2">
                  <MapPin className="w-4 h-4 text-slate-400 mr-1.5 shrink-0" />
                  <span className="truncate">{featuredRequest.location?.address}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Cotización Asignada</h4>
                <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${featuredRequest.quotation ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-50 text-slate-400'}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {featuredRequest.quotation ? 'Presupuesto Listo' : 'En Evaluación'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {featuredRequest.quotation ? `Estado: ${featuredRequest.quotation.status}` : 'El técnico está evaluando el trabajo'}
                      </p>
                    </div>
                  </div>
                  {featuredRequest.quotation ? (
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-semibold mb-0.5">Monto Total</p>
                        <p className="text-sm font-display font-extrabold text-slate-900 tracking-tight">S/ {featuredRequest.quotation.total}</p>
                      </div>
                      <Link
                        to={`/tracking/${featuredRequest.id}`}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl shadow-soft transition-soft flex items-center shrink-0"
                      >
                        Ver Detalle <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">Pendiente</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* LISTA SECUNDARIA: HISTORIAL DE SOLICITUDES ANTERIORES */}
          {historyRequests.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-sm text-slate-500 uppercase tracking-wider pt-4">Historial Reciente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {historyRequests.map((request) => (
                  <div 
                    key={request.id}
                    className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 shadow-soft hover:border-slate-300 transition-soft flex flex-col space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">{request.id}</span>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{request.type}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{request.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{new Date(request.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
                      <Link
                        to={`/tracking/${request.id}`}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center transition-soft"
                      >
                        Ver Ficha <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default Dashboard;
