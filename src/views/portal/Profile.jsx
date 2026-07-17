import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Wrench,
  Clock,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Filter
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Formulario de Perfil
  const initialName = user?.name || '';
  const parts = initialName.trim().split(' ');
  const fallbackFirstname = parts.length > 1 && parts.length <= 2 ? parts[0] : parts.length > 2 ? parts.slice(0, 2).join(' ') : initialName;
  const fallbackLastname = parts.length > 1 && parts.length <= 2 ? parts[1] : parts.length > 2 ? parts.slice(2).join(' ') : '';

  const [firstname, setFirstname] = useState(user?.firstname || fallbackFirstname || '');
  const [lastname, setLastname] = useState(user?.lastname || fallbackLastname || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Historial de solicitudes
  const [requests, setRequests] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Todos');

  const fetchProfileData = async () => {
    try {
      const profileUser = await api.auth.getProfile();
      setFirstname(profileUser.firstname || '');
      setLastname(profileUser.lastname || '');
      setPhone(profileUser.phone);
      setAddress(profileUser.address);
    } catch (err) {
      console.error("Error cargando perfil:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await api.requests.getAll();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchHistory();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    setSaveSuccess(false);
    setSaving(true);

    try {
      await updateProfile({ firstname, lastname, phone, address });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      if (err.validationErrors) {
        setValidationErrors(err.validationErrors);
      } else {
        setError(err.message || 'Error al guardar los datos.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('¿Está seguro de que desea anular esta solicitud técnica?')) return;
    try {
      await api.requests.cancel(requestId);
      await fetchHistory(); // Recargar historial
    } catch (err) {
      alert(err.message || 'Error al cancelar la solicitud');
    }
  };

  // Filtrar solicitudes
  const filteredRequests = statusFilter === 'Todos' 
    ? requests 
    : requests.filter(r => r.status === statusFilter);

  const getStatusBadge = (status, reqObj = null) => {
    const sRaw = (reqObj?.statusRaw || reqObj?.estado_operativo || status || '').toString().toUpperCase();

    if (sRaw === 'CANCELADA' || sRaw === 'CANCELADO' || sRaw === 'ANULADA' || sRaw === 'RECHAZADA' || status === 'Cancelado' || status === 'Anulado') {
      return <span className="bg-rose-50 text-rose-600 text-[10px] font-semibold px-2 py-0.5 rounded border border-rose-200 uppercase">Cancelado</span>;
    }
    if (sRaw === 'FINALIZADA' || sRaw === 'FINALIZADO' || sRaw === 'COMPLETADA' || sRaw === 'TERMINADA' || status === 'Finalizado') {
      return <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200 uppercase">Finalizado</span>;
    }
    if (sRaw === 'EN_PROCESO' || sRaw === 'EN CURSO' || sRaw === 'PROCESO' || sRaw === 'EN_EJECUCION' || status === 'En ejecución' || status === 'En curso') {
      return <span className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-purple-200 uppercase">En Proceso</span>;
    }
    if (sRaw === 'COTIZADA' || status === 'Cotizado') {
      return <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-200 uppercase">Cotizado</span>;
    }
    if (sRaw === 'ASIGNADA' || sRaw === 'ASIGNADO' || status === 'Asignado') {
      return <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-indigo-200 uppercase">Asignado</span>;
    }
    if (status === 'En camino') {
      return <span className="bg-sky-50 text-sky-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-sky-200 uppercase animate-pulse">En camino</span>;
    }
    return <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200 uppercase">Pendiente</span>;
  };

  const getFinancialBadge = (reqObj) => {
    if (!reqObj) return null;
    let estadoPago = (reqObj?.estado_pago || reqObj?.estadoPago || 'PENDIENTE').toString().toUpperCase();

    try {
      const localPending = JSON.parse(localStorage.getItem(`sigesto_pending_payments_${reqObj?.id}`) || localStorage.getItem(`sigesto_pending_payments_${reqObj?.idNumeric}`) || '[]');
      if (Array.isArray(localPending) && localPending.length > 0) {
        const allPayments = Array.isArray(reqObj?.payments) ? reqObj.payments : [];
        const existingIds = new Set(allPayments.map(p => String(p.id_pago || p.id)));
        const unverified = localPending.filter(lp => !existingIds.has(String(lp.id_pago || lp.id)));
        if (unverified.length > 0 && estadoPago !== 'COMPLETADO') {
          estadoPago = 'EN_REVISION';
        }
      }
    } catch (e) {}

    if (estadoPago === 'COMPLETADO') {
      return (
        <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
          Completado
        </span>
      );
    }

    if (estadoPago === 'EN_REVISION') {
      return (
        <span className="inline-flex items-center bg-sky-50 text-sky-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-sky-200 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5 animate-pulse"></span>
          En Revisión
        </span>
      );
    }

    if (estadoPago === 'ADELANTO') {
      return (
        <span className="inline-flex items-center bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-200 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
          Adelanto
        </span>
      );
    }

    return (
      <span className="inline-flex items-center bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200 uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
        Pendiente de Pago
      </span>
    );
  };

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in">
      
      {/* Título */}
      <div>
        <h1 className="font-display font-extrabold text-xl md:text-2xl text-slate-900">
          Mi Perfil y Operaciones
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Gestione sus datos de contacto y consulte su historial histórico completo de servicios.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        
        {/* Columna de Datos de Perfil (Chica) */}
        <div className="space-y-6">
          <div className="bg-white/90 backdrop-blur-lg border border-slate-200/60 rounded-3xl p-6 shadow-soft space-y-5">
            <h3 className="font-display font-bold text-sm text-slate-800">Datos Personales</h3>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center space-x-2.5 text-xs text-emerald-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Perfil actualizado correctamente.</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-2.5 text-xs text-rose-600">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Nombres</label>
                  <div className="relative">
                    <User className="absolute left-3 top-[50%] -translate-y-[50%] w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={firstname}
                      onChange={(e) => setFirstname(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:bg-white transition-soft ${
                        validationErrors.nombres ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  {validationErrors.nombres && (
                    <p className="text-[10px] text-rose-500 mt-1">{validationErrors.nombres[0]}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Apellidos</label>
                  <div className="relative">
                    <User className="absolute left-3 top-[50%] -translate-y-[50%] w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={lastname}
                      onChange={(e) => setLastname(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:bg-white transition-soft ${
                        validationErrors.apellidos ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  {validationErrors.apellidos && (
                    <p className="text-[10px] text-rose-500 mt-1">{validationErrors.apellidos[0]}</p>
                  )}
                </div>
              </div>

              {/* Email (Solo lectura) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Correo (No modificable)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-[50%] -translate-y-[50%] w-4.5 h-4.5 text-slate-300" />
                  <input
                    type="email"
                    disabled
                    value={user?.email}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border border-slate-200 text-slate-400 rounded-xl text-xs select-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Rol (Solo lectura) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Tipo de Cuenta</label>
                <div className="relative">
                  <ShieldAlert className="absolute left-3 top-[50%] -translate-y-[50%] w-4.5 h-4.5 text-slate-300" />
                  <input
                    type="text"
                    disabled
                    value={user?.rol || 'CLIENTE'}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border border-slate-200 text-slate-400 rounded-xl text-xs select-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Teléfono Móvil</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-[50%] -translate-y-[50%] w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:bg-white transition-soft ${
                      validationErrors.telefono ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {validationErrors.telefono && (
                  <p className="text-[10px] text-rose-500 mt-1">{validationErrors.telefono[0]}</p>
                )}
              </div>

              {/* Dirección */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Dirección de Envío</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-[50%] -translate-y-[50%] w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:bg-white transition-soft ${
                      validationErrors.direccion ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {validationErrors.direccion && (
                  <p className="text-[10px] text-rose-500 mt-1">{validationErrors.direccion[0]}</p>
                )}
              </div>

              {/* Guardar cambios */}
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-soft transition-soft hover-lift cursor-pointer disabled:opacity-75"
              >
                {saving ? 'Guardando...' : 'Actualizar Información'}
              </button>
            </form>
          </div>
        </div>

        {/* Historial Completo de Servicios (Columna Grande) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-display font-bold text-sm text-slate-800">Historial Técnico Completo</h3>
            
            {/* Filtros */}
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {['Todos', 'Finalizado', 'Cancelado', 'En camino', 'Asignado'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold border cursor-pointer shrink-0 transition-soft ${
                    statusFilter === filter
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {filter === 'Todos' ? 'Todos' : filter === 'Cancelado' ? 'Anulados' : filter}
                </button>
              ))}
            </div>
          </div>

          {loadingHistory ? (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-10 text-center shadow-soft">
              <div className="inline-block w-6 h-6 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 text-xs mt-3">Sincronizando operaciones previas...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-10 text-center shadow-soft text-xs text-slate-400">
              No se encontraron solicitudes para el filtro seleccionado.
            </div>
          ) : (
            <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-soft-sm text-xs">
              <div className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <div key={req.id} className="p-4 hover:bg-slate-50/50 transition-soft flex items-center justify-between gap-4">
                    
                    <div className="space-y-1 text-left min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {getStatusBadge(req.status, req)}
                        {getFinancialBadge(req)}
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm truncate">{req.type}</h4>
                      <div className="flex items-center text-[10px] text-slate-400 space-x-3.5">
                        <span>Creado: {new Date(req.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
                        <span className="truncate max-w-[200px]">📍 {req.location.address}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {req.status === 'Pendiente' && (
                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          className="px-2.5 py-1.5 border border-slate-200 text-slate-500 hover:text-red-500 bg-white hover:bg-red-50 rounded-lg transition-soft text-[10px] font-semibold cursor-pointer"
                        >
                          Anular
                        </button>
                      )}
                      
                      <Link
                        to={`/tracking/${req.id}`}
                        className="p-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg border border-slate-200/40 text-slate-400 transition-soft"
                        title="Ver detalles"
                      >
                        <ChevronRight className="w-4.5 h-4.5" />
                      </Link>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Profile;
