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

  const getVisualStageIndex = (reqObj, rawIndex) => {
    if (!reqObj) return rawIndex;
    let maxIndex = rawIndex;

    const timeline = Array.isArray(reqObj.timeline) ? reqObj.timeline : (Array.isArray(reqObj.historial) ? reqObj.historial : []);
    timeline.forEach(item => {
      const s = (item.estado || item.status || item.titulo || item.title || item.descripcion || '').toString().toUpperCase();
      if (['FINALIZADA', 'FINALIZADO', 'COMPLETADA', 'TERMINADA', 'CONCLUIDA'].some(k => s.includes(k))) {
        if (maxIndex < 4) maxIndex = 4;
      } else if (['EN_PROCESO', 'EN CURSO', 'PROCESO', 'EN_EJECUCION'].some(k => s.includes(k))) {
        if (maxIndex < 3) maxIndex = 3;
      } else if (['COTIZADA', 'REVISION_PAGO', 'REVICION_PAGO', 'EN_REVISION', 'REVISION', 'PENDIENTE_PAGO', 'APROBADA', 'APROBADO', 'PAGADA', 'PAGADO'].some(k => s.includes(k))) {
        if (maxIndex < 2) maxIndex = 2;
      }
    });

    const allPays = Array.isArray(reqObj.payments) ? reqObj.payments : (Array.isArray(reqObj.pagos) ? reqObj.pagos : []);
    const hasVerifiedPayment = allPays.some(p => ['VERIFICADO', 'APROBADO', 'COMPLETADO'].includes((p.estado || '').toString().toUpperCase()));
    if (hasVerifiedPayment && maxIndex < 2) {
      maxIndex = 2;
    }

    const reqId = reqObj.id || reqObj.idNumeric || reqObj.uuid_solicitud || 'unknown';
    if (reqId && reqId !== 'unknown') {
      const storageKey = `sigesto_visual_max_op_stage_${reqId}`;
      try {
        const storedMax = Number(localStorage.getItem(storageKey) || 0);
        const rawS = (reqObj.statusRaw || reqObj.estado_operativo || reqObj.estado || reqObj.status || '').toString().toUpperCase();
        const isTrulyFinal = ['FINALIZADA', 'FINALIZADO', 'COMPLETADA', 'TERMINADA', 'CONCLUIDA'].some(k => rawS.includes(k)) || timeline.some(t => ['FINALIZADA', 'FINALIZADO', 'COMPLETADA', 'TERMINADA', 'CONCLUIDA'].some(k => (t.estado || t.status || t.titulo || '').toString().toUpperCase().includes(k)));

        if (storedMax === 4 && !isTrulyFinal) {
          localStorage.setItem(storageKey, String(maxIndex));
        } else if (!isNaN(storedMax) && storedMax > maxIndex && storedMax <= (isTrulyFinal ? 4 : 3)) {
          maxIndex = storedMax;
        } else if (maxIndex > storedMax) {
          localStorage.setItem(storageKey, String(maxIndex));
        }
      } catch (e) {}
    }

    return maxIndex;
  };

  const getStatusBadge = (status, reqObj = null) => {
    const sRaw = (reqObj?.statusRaw || reqObj?.estado_operativo || reqObj?.estado || reqObj?.status || status || '').toString().toUpperCase();

    if (['CANCELADA', 'CANCELADO', 'ANULADA', 'RECHAZADA'].includes(sRaw) || sRaw.includes('CANCELAD') || sRaw.includes('RECHAZAD') || sRaw.includes('ANULAD')) {
      return <span className="bg-rose-50 text-rose-600 text-[10px] font-semibold px-2 py-0.5 rounded border border-rose-200 uppercase">Cancelado</span>;
    }

    let baseIdx = 0;
    if (['FINALIZADA', 'FINALIZADO', 'COMPLETADA', 'TERMINADA', 'CONCLUIDA'].includes(sRaw) || sRaw.includes('FINALIZAD') || sRaw.includes('TERMINAD') || sRaw.includes('COMPLETAD') || sRaw.includes('CONCLUID')) baseIdx = 4;
    else if (['EN_PROCESO', 'EN CURSO', 'PROCESO', 'EN_EJECUCION'].includes(sRaw) || sRaw.includes('PROCESO') || sRaw.includes('CURSO') || sRaw.includes('EJECUCION')) baseIdx = 3;
    else if (['COTIZADA', 'REVISION_PAGO', 'REVICION_PAGO', 'EN_REVISION', 'REVISION', 'PENDIENTE_PAGO', 'APROBADA', 'APROBADO', 'PAGADA', 'PAGADO'].includes(sRaw) || sRaw.includes('COTIZAD') || sRaw.includes('REVISION') || sRaw.includes('REVICION') || sRaw.includes('APROBAD') || sRaw.includes('PAGAD')) baseIdx = 2;
    else if (['ASIGNADA', 'ASIGNADO'].includes(sRaw) || sRaw.includes('ASIGNAD')) baseIdx = 1;

    const stRaw = (reqObj?.statusRaw || reqObj?.status || '').toString().toUpperCase();
    const epRaw = (reqObj?.estado_pago || reqObj?.estadoPago || '').toString().toUpperCase();
    const totPaidCheck = parseFloat(reqObj?.total_pagado || reqObj?.monto_pagado || reqObj?.totalPagado || 0);
    const totAmountCheck = parseFloat(reqObj?.quotation?.total || reqObj?.quotation?.monto_total || 0);

    if (stRaw === 'PAGADA' || epRaw === 'COMPLETADO' || (totAmountCheck > 0 && totPaidCheck >= totAmountCheck - 0.01)) {
      try {
        if (reqObj?.id) localStorage.removeItem(`sigesto_pending_payments_${reqObj.id}`);
        if (reqObj?.idNumeric) localStorage.removeItem(`sigesto_pending_payments_${reqObj.idNumeric}`);
      } catch (e) {}
    }

    let hasPaymentsOrReview = reqObj?.hasInReviewPayment === true ||
      (Array.isArray(reqObj?.payments) && reqObj.payments.length > 0) ||
      totPaidCheck > 0.01 ||
      ['REVISION_PAGO', 'REVICION_PAGO', 'EN_REVISION', 'REVISION', 'PENDIENTE_VALIDACION', 'VERIFICANDO'].includes((reqObj?.estado_pago || reqObj?.estadoPago || reqObj?.cotizacion?.estado_pago || '').toString().toUpperCase()) ||
      (reqObj?.quotation && (totAmountCheck > 0 || (reqObj.quotation.status && reqObj.quotation.status !== 'BORRADOR')));

    if (!hasPaymentsOrReview && reqObj && (reqObj.id || reqObj.idNumeric) && stRaw !== 'PAGADA' && epRaw !== 'COMPLETADO') {
      try {
        const localPending = JSON.parse(localStorage.getItem(`sigesto_pending_payments_${reqObj.id}`) || localStorage.getItem(`sigesto_pending_payments_${reqObj.idNumeric}`) || '[]');
        if (Array.isArray(localPending) && localPending.length > 0) {
          hasPaymentsOrReview = true;
        }
      } catch (e) {}
    }

    if (hasPaymentsOrReview && baseIdx < 2) baseIdx = 2;

    const visualIdx = getVisualStageIndex(reqObj, baseIdx);

    if (visualIdx === 4) {
      return <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200 uppercase">Finalizado</span>;
    }
    if (visualIdx === 3) {
      return <span className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-purple-200 uppercase">En Proceso</span>;
    }
    if (visualIdx === 2) {
      return <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-200 uppercase">Cotizado</span>;
    }
    if (visualIdx === 1) {
      return <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-indigo-200 uppercase">Asignado</span>;
    }
    return <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200 uppercase">Pendiente</span>;
  };

  const getFinancialBadge = (reqObj) => {
    if (!reqObj) return null;
    const estado = (reqObj?.statusRaw || reqObj?.estado_operativo || reqObj?.estado || reqObj?.status || '').toString().toUpperCase();
    const estadoPago = (reqObj?.estado_pago || reqObj?.estadoPago || 'PENDIENTE').toString().toUpperCase();
    const totalAmount = parseFloat(reqObj?.quotation?.total || reqObj?.quotation?.monto_total || 0);

    let allPayments = Array.isArray(reqObj?.payments) ? [...reqObj.payments] : [];
    try {
      const localPending = JSON.parse(localStorage.getItem(`sigesto_pending_payments_${reqObj?.id}`) || localStorage.getItem(`sigesto_pending_payments_${reqObj?.idNumeric}`) || '[]');
      if (Array.isArray(localPending) && localPending.length > 0) {
        const existingIds = new Set(allPayments.map(p => String(p.id_pago || p.id)));
        const unverified = localPending.filter(lp => !existingIds.has(String(lp.id_pago || lp.id)));
        allPayments = [...unverified, ...allPayments];
      }
    } catch (e) {}

    const activePayments = allPayments.filter(p => !['RECHAZADO', 'CANCELADO'].includes((p.estado || '').toString().toUpperCase()));
    const progressedStates = ['APROBADA', 'EN_PROCESO', 'FINALIZADA', 'COMPLETADO', 'COMPLETADA', 'TERMINADA', 'ENTREGADA', 'LISTO'];
    const completedFinancialStates = ['PAGADA', 'PAGADO', 'COMPLETADO', 'COMPLETADA', 'FINALIZADA', 'FINALIZADO', 'TERMINADA', 'TERMINADO', 'ENTREGADA', 'ENTREGADO', 'LISTO', 'CONFIRMADO', 'LIQUIDADO', 'TOTAL'];

    const isPaymentVerified = (pago, idx, activeList = activePayments) => {
      const pEstado = (pago.estado || '').toString().toUpperCase();
      if (['RECHAZADO', 'CANCELADO'].includes(pEstado)) return false;
      if (['VERIFICADO', 'APROBADO', 'COMPLETADO', 'PAGADO', 'CONFIRMADO', 'VALIDADO'].includes(pEstado)) return true;
      if (completedFinancialStates.includes(estado) || completedFinancialStates.includes(estadoPago)) return true;

      const isLocal = String(pago.id_pago || pago.id || '').startsWith('local-') || pago.isLocalPending;
      if (isLocal) return false;

      const concepto = (pago.concepto || '').toLowerCase();
      const isRestanteConcept = concepto.includes('saldo') || concepto.includes('liquid') || concepto.includes('restante');
      if (isRestanteConcept && !completedFinancialStates.includes(estado) && !completedFinancialStates.includes(estadoPago)) return false;

      if (activeList.length > 1 || progressedStates.includes(estado) || estadoPago === 'ADELANTO') {
        if (activeList.length > 1) {
          const serverPayments = activeList.filter(p => !String(p.id_pago || p.id || '').startsWith('local-') && !p.isLocalPending);
          const candidates = serverPayments.length > 0 ? serverPayments : activeList;
          const oldestPayment = candidates.reduce((oldest, current) => {
            const idOld = parseFloat(oldest.id_pago || oldest.id);
            const idCur = parseFloat(current.id_pago || current.id);
            if (!isNaN(idOld) && !isNaN(idCur)) {
              return idCur < idOld ? current : oldest;
            }
            return oldest;
          }, candidates[0]);

          if (pago === oldestPayment || (pago.id_pago && String(pago.id_pago) === String(oldestPayment.id_pago))) {
            return true;
          } else {
            return false;
          }
        }

        if (progressedStates.includes(estado) || estadoPago === 'ADELANTO') {
          return true;
        }
      }

      return false;
    };

    const verifiedPayments = allPayments.filter((p, i) => isPaymentVerified(p, i));
    const inReviewPayments = allPayments.filter((p, i) => !isPaymentVerified(p, i) && !['RECHAZADO', 'CANCELADO'].includes((p.estado || '').toString().toUpperCase()));
    const verifiedTotalPaid = Math.max(
      verifiedPayments.reduce((sum, p) => sum + parseFloat(p.monto_pagado || p.monto || 0), 0),
      completedFinancialStates.includes(estado) || completedFinancialStates.includes(estadoPago) ? parseFloat(reqObj?.total_pagado || reqObj?.monto_pagado || reqObj?.totalPagado || 0) : 0
    );

    // 1. Pagado / Liquidado (aprobado por admin)
    if (completedFinancialStates.includes(estado) || completedFinancialStates.includes(estadoPago) || (totalAmount > 0 && verifiedTotalPaid >= totalAmount - 0.01 && inReviewPayments.length === 0)) {
      return (
        <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
          Pagado / Liquidado
        </span>
      );
    }

    // 2. Pago en Revisión (100% abonado o enviado en un solo paso)
    const totalInReviewOrActive = activePayments.reduce((sum, p) => sum + parseFloat(p.monto_pagado || p.monto || 0), 0);
    if (inReviewPayments.length > 0 && verifiedTotalPaid <= 0.01 && totalAmount > 0 && (totalInReviewOrActive >= totalAmount - 0.01 || inReviewPayments.some(p => parseFloat(p.monto_pagado || p.monto || 0) >= totalAmount - 0.01)) && !progressedStates.includes(estado)) {
      return (
        <span className="inline-flex items-center bg-sky-50 text-sky-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-sky-200 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5 animate-pulse"></span>
          Pago en Revisión
        </span>
      );
    }

    // 3. Liquidación en Revisión
    if ((verifiedTotalPaid > 0.01 || progressedStates.includes(estado) || estadoPago === 'ADELANTO' || activePayments.length > 1) && inReviewPayments.length > 0) {
      return (
        <span className="inline-flex items-center bg-sky-50 text-sky-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-sky-200 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5 animate-pulse"></span>
          Liquidación en Revisión
        </span>
      );
    }

    // 4. Adelanto en Revisión
    if (inReviewPayments.length > 0 && verifiedTotalPaid <= 0.01 && !progressedStates.includes(estado) && estadoPago !== 'ADELANTO') {
      return (
        <span className="inline-flex items-center bg-sky-50 text-sky-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-sky-200 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5 animate-pulse"></span>
          Adelanto en Revisión
        </span>
      );
    }

    // 4. Adelanto Confirmado / Aprobado
    if (verifiedTotalPaid > 0.01 || progressedStates.includes(estado) || estadoPago === 'ADELANTO') {
      return (
        <span className="inline-flex items-center bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-200 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
          Adelanto Confirmado
        </span>
      );
    }

    return (
      <span className="inline-flex items-center bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200 uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
        Por Cotizar / Pendiente de Pago
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
