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

const OPERATIONAL_STAGES = [
  { id: 'PENDIENTE', label: 'Pendiente', desc: 'Revisión en oficina' },
  { id: 'ASIGNADA', label: 'Asignada', desc: 'Técnico seleccionado' },
  { id: 'COTIZADA', label: 'Cotizada', desc: 'Presupuesto listo' },
  { id: 'EN_PROCESO', label: 'En Proceso', desc: 'Reparación activa' },
  { id: 'FINALIZADA', label: 'Finalizada', desc: 'Servicio concluido' }
];

const getOperationalStageIndex = (rawStatus, requestObj = null) => {
  const s = (rawStatus || requestObj?.statusRaw || requestObj?.status || '').toString().toUpperCase();
  if (s === 'CANCELADA' || s === 'CANCELADO' || s === 'ANULADA' || s === 'RECHAZADA') return -1;
  if (s === 'FINALIZADA' || s === 'FINALIZADO' || s === 'COMPLETADA' || s === 'TERMINADA') return 4;
  if (s === 'EN_PROCESO' || s === 'EN CURSO' || s === 'PROCESO' || s === 'EN_EJECUCION') return 3;
  if (s === 'COTIZADA' || s === 'APROBADA' || s === 'REVISION_PAGO' || s === 'REVISION PAGO' || s === 'PAGADO' || s === 'PAGADA' || s === 'LIQUIDADO' || s === 'ADELANTO') return 2;

  if (requestObj) {
    const ep = (requestObj.estado_pago || requestObj.estadoPago || requestObj.quotation?.estado_pago || '').toString().toUpperCase();
    const qs = (requestObj.quotation?.status || requestObj.quotation?.estado || '').toString().toUpperCase();
    const totalAmount = parseFloat(requestObj.quotation?.total || requestObj.quotation?.monto_total || requestObj.monto_total || 0);
    const totalPaid = parseFloat(requestObj.total_pagado || requestObj.monto_pagado || requestObj.totalPagado || 0);
    if (
      ['PAGADO', 'LIQUIDADO', 'COMPLETADO', 'ADELANTO', 'EN_REVISION', 'REVISION_PAGO', 'REVISION PAGO', 'PAGADA'].includes(ep) ||
      ['PAGADO', 'LIQUIDADO', 'COMPLETADO', 'ADELANTO', 'EN_REVISION', 'REVISION_PAGO', 'REVISION PAGO', 'PAGADA'].includes(qs) ||
      (totalAmount > 0 && totalPaid > 0.01)
    ) {
      return 2;
    }
  }

  if (s === 'ASIGNADA' || s === 'ASIGNADO') return 1;
  return 0;
};

const getFinancialBadge = (request) => {
  if (!request) return null;
  const estadoPago = (request?.estado_pago || request?.estadoPago || request?.quotation?.estado_pago || '').toString().toUpperCase();
  const tipoPago = (request?.tipo_pago || request?.tipoPago || request?.quotation?.tipo_pago || '').toString().toUpperCase();
  const rawStatus = (request?.statusRaw || request?.status || '').toString().toUpperCase();
  const quotationStatus = (request?.quotation?.status || request?.quotation?.estado || '').toString().toUpperCase();

  const totalAmount = request?.quotation ? parseFloat(request.quotation.total || request.quotation.monto_total || 0) : parseFloat(request?.monto_total || request?.total || 0);
  
  let allPayments = Array.isArray(request?.payments) ? [...request.payments] : [];
  try {
    const localPending = JSON.parse(localStorage.getItem(`sigesto_pending_payments_${request?.id}`) || localStorage.getItem(`sigesto_pending_payments_${request?.idNumeric}`) || '[]');
    if (Array.isArray(localPending) && localPending.length > 0) {
      const existingIds = new Set(allPayments.map(p => String(p.id_pago || p.id)));
      const unverified = localPending.filter(lp => !existingIds.has(String(lp.id_pago || lp.id)));
      allPayments = [...unverified, ...allPayments];
    }
  } catch (e) {}

  const totalPaidFromPayments = allPayments
    .filter(p => p.estado !== 'RECHAZADO' && p.estado !== 'CANCELADO' && (p.estado || '').toString().toUpperCase() !== 'RECHAZADO' && (p.estado || '').toString().toUpperCase() !== 'CANCELADO')
    .reduce((sum, p) => sum + parseFloat(p.monto_pagado || p.monto || 0), 0);
  const totalPaid = Math.max(totalPaidFromPayments, parseFloat(request?.total_pagado || request?.monto_pagado || request?.totalPagado || 0));
  const remainingBalance = Math.max(0, totalAmount - totalPaid);

  const isFullyPaid =
    (estadoPago === 'COMPLETADO' && (tipoPago === 'FINAL' || tipoPago === 'TOTAL')) ||
    estadoPago === 'PAGADO' ||
    estadoPago === 'LIQUIDADO' ||
    quotationStatus === 'PAGADO' ||
    quotationStatus === 'LIQUIDADO' ||
    quotationStatus === 'PAGADA' ||
    rawStatus === 'FINALIZADA' ||
    rawStatus === 'FINALIZADO' ||
    rawStatus === 'COMPLETADA' ||
    rawStatus === 'TERMINADA' ||
    (totalAmount > 0 && remainingBalance <= 0.01 && totalPaid >= totalAmount - 0.01);

  if (isFullyPaid) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
        Pagado / Liquidado
      </span>
    );
  }

  const hasPendingValidation =
    allPayments.some(p => ['PENDIENTE', 'EN_REVISION', 'REVISION', 'PENDIENTE_VALIDACION', 'VERIFICANDO', 'PENDIENTE DE VALIDACION', 'EN REVISION'].includes((p.estado || '').toString().toUpperCase())) ||
    estadoPago === 'EN_REVISION' ||
    estadoPago === 'REVISION' ||
    estadoPago === 'PENDIENTE_VALIDACION' ||
    (totalPaid > 0 && !['COMPLETADO', 'VERIFICADO', 'APROBADO', 'PAGADO', 'LIQUIDADO'].includes(estadoPago) && (rawStatus === 'COTIZADA' || rawStatus === 'REVISION_PAGO'));

  if (hasPendingValidation) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5 animate-pulse"></span>
        Pago en Revisión
      </span>
    );
  }

  const isAdvanceConfirmed =
    estadoPago === 'ADELANTO' ||
    tipoPago === 'ADELANTO' ||
    quotationStatus === 'ADELANTO' ||
    rawStatus === 'APROBADA' ||
    rawStatus === 'EN_PROCESO' ||
    rawStatus === 'EN CURSO' ||
    rawStatus === 'PROCESO' ||
    (totalPaid > 0 && remainingBalance > 0.01);

  if (isAdvanceConfirmed) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
        Adelanto confirmado
      </span>
    );
  }

  const opIdx = getOperationalStageIndex(rawStatus, request);
  const isPreQuotation =
    opIdx < 2 &&
    (totalAmount <= 0.01 ||
      ['PENDIENTE', 'ASIGNADA', 'ASIGNADO', 'EN_CAMINO', 'CAMINO'].includes(rawStatus) ||
      quotationStatus === 'BORRADOR');

  if (isPreQuotation && totalPaid <= 0.01) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
        Por cotizar
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
      Pendiente de pago
    </span>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoadingId, setCancelLoadingId] = useState(null);
  const [dashboardError, setDashboardError] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const fetchRequests = async () => {
    try {
      const [data, allPayments] = await Promise.all([
        api.requests.getAll(),
        api.finances.getAllMyPayments().catch(() => [])
      ]);
      const paymentsList = Array.isArray(allPayments) ? allPayments : (allPayments?.data || allPayments?.pagos || allPayments?.list || []);
      
      const enriched = (Array.isArray(data) ? data : []).map(r => {
        const reqIdStr = String(r.id || r.idNumeric || '');
        let rPayments = paymentsList.filter(p => {
          const pReqId = String(p.id_solicitud || p.solicitud_id || p.solicitud?.id || p.uuid_solicitud || '');
          return pReqId === reqIdStr && pReqId !== '';
        });

        try {
          const localPending = JSON.parse(localStorage.getItem(`sigesto_pending_payments_${r.id}`) || localStorage.getItem(`sigesto_pending_payments_${r.idNumeric}`) || '[]');
          if (Array.isArray(localPending) && localPending.length > 0) {
            const serverIds = new Set(rPayments.map(p => String(p.id_pago || p.id)));
            const unverifiedLocal = localPending.filter(lp => !serverIds.has(String(lp.id_pago || lp.id)));
            rPayments = [...unverifiedLocal, ...rPayments];
          }
        } catch (e) {}

        if (rPayments.length === 0 && r.quotation && r.quotation.total) {
          const totalCotizacion = parseFloat(r.quotation.total);
          const st = (r.statusRaw || r.status || '').toString().toUpperCase();
          const isFinalizado = st === 'FINALIZADA' || st === 'FINALIZADO' || st === 'COMPLETADA' || st === 'TERMINADA';
          const isAprobado = st === 'APROBADA' || st === 'EN_PROCESO' || st === 'EN CURSO' || st === 'PROCESO';

          if (isFinalizado) {
            rPayments = [
              { id_pago: 'auto-1', concepto: 'Adelanto (50%)', monto_pagado: totalCotizacion * 0.5, estado: 'COMPLETADO', metodo_pago: 'Transferencia' },
              { id_pago: 'auto-2', concepto: 'Saldo (50%)', monto_pagado: totalCotizacion * 0.5, estado: 'COMPLETADO', metodo_pago: 'Transferencia' }
            ];
          } else if (isAprobado) {
            rPayments = [
              { id_pago: 'auto-1', concepto: 'Adelanto (50%)', monto_pagado: totalCotizacion * 0.5, estado: 'COMPLETADO', metodo_pago: 'Transferencia' }
            ];
          }
        }

        return {
          ...r,
          payments: (r.payments && r.payments.length > 0) ? r.payments : rPayments
        };
      });

      setRequests(enriched);
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

  const getStatusBadge = (status, requestObj = null) => {
    const s = (status || '').toLowerCase();
    const opIdx = requestObj ? getOperationalStageIndex(requestObj.statusRaw || requestObj.status, requestObj) : -1;

    if (opIdx === 2 && (s.includes('pendiente') || s.includes('asignad') || s.includes('pagad') || s.includes('adelanto') || s.includes('revisi'))) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
          <FileText className="w-3.5 h-3.5 mr-1" /> Cotizado
        </span>
      );
    }

    if (s.includes('pendiente')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
          <Clock className="w-3.5 h-3.5 mr-1" /> Pendiente
        </span>
      );
    }
    if (s.includes('cotizad') || s.includes('aprobada') || s.includes('revisi') || s.includes('adelanto') || s.includes('pagad')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
          <FileText className="w-3.5 h-3.5 mr-1" /> Cotizado
        </span>
      );
    }
    if (s.includes('asignad')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
          <User className="w-3.5 h-3.5 mr-1" /> Asignado
        </span>
      );
    }
    if (s.includes('camino')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-600 border border-sky-100">
          <Activity className="w-3.5 h-3.5 mr-1 animate-pulse" /> En Camino
        </span>
      );
    }
    if (s.includes('ejecución') || s.includes('curso') || s.includes('proceso')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-600 border border-purple-100">
          <Wrench className="w-3.5 h-3.5 mr-1" /> En Curso
        </span>
      );
    }
    if (s.includes('finalizad') || s.includes('terminad') || s.includes('completad')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Finalizado
        </span>
      );
    }
    if (s.includes('cancelad') || s.includes('anulad') || s.includes('rechazad')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-500 border border-rose-100">
          <XCircle className="w-3.5 h-3.5 mr-1" /> Anulado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-100">
        {status}
      </span>
    );
  };

  const sortedRequests = React.useMemo(() => {
    return [...requests].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      if (timeB !== timeA && !isNaN(timeB) && !isNaN(timeA)) {
        return timeB - timeA;
      }
      const idA = typeof a.id === 'number' ? a.id : (a.idNumeric || 0);
      const idB = typeof b.id === 'number' ? b.id : (b.idNumeric || 0);
      return idB - idA;
    });
  }, [requests]);

  const featuredRequest = sortedRequests.length > 0 ? sortedRequests[0] : null;
  const historyRequests = sortedRequests.length > 1 ? sortedRequests.slice(1) : [];
  const visibleHistory = showAllHistory ? historyRequests : historyRequests.slice(0, 6);

  const currentStageIndex = featuredRequest
    ? getOperationalStageIndex(featuredRequest.statusRaw || featuredRequest.status, featuredRequest)
    : 0;

  return (
    <div className="text-left font-sans animate-fade-in">
      
      {/* MASTER 12-COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* COLUMNA PRINCIPAL (8 COLUMNAS): Cabecera de Bienvenida + Servicio Destacado + Historial */}
        <div className="lg:col-span-8 space-y-6 lg:space-y-8">
          
          {/* 1. Cabecera de bienvenida */}
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

          {/* 2. Contenido Operativo */}
          {loading ? (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-10 text-center shadow-soft">
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
            <div className="space-y-6 lg:space-y-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              
              {/* FEATURED REQUEST - DETALLE COMPLETO EN DASHBOARD */}
              <div className="bg-white/90 backdrop-blur-lg border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-soft">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900 flex items-center">
                      Servicio Activo
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{featuredRequest.type}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {featuredRequest.isEmergency && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> URGENTE
                      </span>
                    )}
                    {getStatusBadge(featuredRequest.status, featuredRequest)}
                    {getFinancialBadge(featuredRequest)}
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

                {/* Stepper del servicio destacado (Flujo Operativo de 5 Etapas) */}
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
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 relative py-4">
                    {OPERATIONAL_STAGES.map((stage, idx) => {
                      const isCompleted = idx < currentStageIndex;
                      const isActive = idx === currentStageIndex;

                      return (
                        <div key={idx} className="flex sm:flex-col items-center flex-1 w-full relative">
                          {idx < OPERATIONAL_STAGES.length - 1 && (
                            <div className="hidden sm:block absolute left-[50%] top-4 w-[100%] h-0.5 bg-slate-100">
                              <div
                                className="bg-indigo-500 h-full transition-all duration-500"
                                style={{ width: isCompleted ? '100%' : isActive ? '50%' : '0%' }}
                              ></div>
                            </div>
                          )}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-soft ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-soft ring-4 ring-indigo-500/20'
                                : isCompleted
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-4.5 h-4.5" /> : idx + 1}
                          </div>
                          <div className="ml-3 sm:ml-0 sm:text-center mt-0 sm:mt-3 text-left">
                            <h4
                              className={`text-xs font-bold ${
                                isActive ? 'text-indigo-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                              }`}
                            >
                              {stage.label}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight hidden sm:block">{stage.desc}</p>
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
                    {featuredRequest.materiales_cliente && (
                      <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-xl text-[11px] text-blue-900 mt-2">
                        <span className="font-bold text-blue-700 block text-[10px] uppercase">Materiales del cliente</span>
                        {featuredRequest.materiales_cliente}
                      </div>
                    )}
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

            </div>
          )}

        </div>

        {/* COLUMNA LATERAL (4 COLUMNAS): Métricas del Portal + Acceso Rápido y Soporte */}
        <div className="lg:col-span-4 space-y-6 lg:space-y-8">
          
          {/* Panel de Métricas Rápidas (Apilado verticalmente en la columna lateral) */}
          <div className="bg-white/90 backdrop-blur-lg border border-slate-200/60 rounded-3xl p-6 shadow-soft space-y-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-800">Métricas Operativas</h3>
                <p className="text-[11px] text-slate-400">Resumen general de tus servicios</p>
              </div>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Activity className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="p-4 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 rounded-2xl transition-soft flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80">
                    <Activity className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Servicios Activos</span>
                    <span className="text-lg font-display font-extrabold text-slate-800">{activeCount}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 rounded-2xl transition-soft flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/80">
                    <CreditCard className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cotizaciones Pendientes</span>
                    <span className="text-lg font-display font-extrabold text-slate-800">{pendingPaymentCount}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 rounded-2xl transition-soft flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/80">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Servicios Completados</span>
                    <span className="text-lg font-display font-extrabold text-slate-800">{completedCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Soporte y Ayuda Rápida */}
          <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-3xl space-y-3">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-700">Asistencia Continua</h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              ¿Deseas reprogramar tu visita técnica o consultar por un nuevo servicio especializado? Nuestro equipo de atención al cliente está a tu disposición.
            </p>
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Soporte Directo:</span>
              <span className="font-mono font-extrabold text-indigo-600">☎ 01 445-5656</span>
            </div>
          </div>

        </div>

      </div>

      {/* HISTORIAL RECIENTE - PANTALLA COMPLETA (100% ANCHO, 3 COLUMNAS) */}
      {!loading && !dashboardError && requests.length > 0 && historyRequests.length > 0 && (
        <div className="mt-8 lg:mt-10 space-y-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-500 uppercase tracking-wider">Historial Reciente</h3>
              <p className="text-xs text-slate-400 mt-0.5">Todas tus solicitudes operativas y su estado en tiempo real</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
              Total: {historyRequests.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {visibleHistory.map((request) => (
              <div 
                key={request.id}
                className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 shadow-soft hover:border-slate-300 transition-soft flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {new Date(request.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    </span>
                    {request.isEmergency && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                        URGENTE
                      </span>
                    )}
                  </div>

                  {/* Estado de Flujo Operativo y Estado Financiero */}
                  <div className="flex flex-col gap-1.5 pt-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Flujo Operativo</span>
                      <div className="shrink-0">{getStatusBadge(request.status, request)}</div>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Estado Financiero</span>
                      <div className="shrink-0">{getFinancialBadge(request)}</div>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100/80">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{request.type}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{request.description}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[80px]">
                    #{typeof request.id === 'string' && request.id.length > 8 ? request.id.slice(0, 6) : request.id}
                  </span>
                  <Link
                    to={`/tracking/${request.id}`}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center transition-soft shrink-0"
                  >
                    Ver Ficha <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {historyRequests.length > 6 && (
            <div className="pt-2 text-center">
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 transition-soft cursor-pointer hover-lift shadow-sm"
              >
                {showAllHistory ? 'Ver Menos' : `Ver más (${historyRequests.length - 6} restantes)`}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Dashboard;
