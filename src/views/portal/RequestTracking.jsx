import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  Clock, 
  MapPin, 
  Phone, 
  Activity, 
  CheckCircle2, 
  ArrowLeft,
  XCircle,
  AlertTriangle,
  Camera,
  CreditCard,
  Copy,
  Check,
  FileText,
  DollarSign,
  Hash,
  ArrowRight
} from 'lucide-react';

const OPERATIONAL_STAGES = [
  { id: 'PENDIENTE', label: 'Pendiente', desc: 'Revisión en oficina' },
  { id: 'ASIGNADA', label: 'Asignada', desc: 'Técnico seleccionado' },
  { id: 'COTIZADA', label: 'Cotizada', desc: 'Presupuesto listo' },
  { id: 'EN_PROCESO', label: 'En Proceso', desc: 'Reparación activa' },
  { id: 'FINALIZADA', label: 'Finalizada', desc: 'Servicio concluido' }
];

const getOperationalStageIndex = (rawStatus) => {
  if (!rawStatus) return 0;
  const s = rawStatus.toString().toUpperCase();
  if (s === 'CANCELADA' || s === 'CANCELADO' || s === 'ANULADA' || s === 'RECHAZADA') return -1;
  if (s === 'FINALIZADA' || s === 'FINALIZADO' || s === 'COMPLETADA' || s === 'TERMINADA') return 4;
  if (s === 'EN_PROCESO' || s === 'EN CURSO' || s === 'PROCESO') return 3;
  if (s === 'COTIZADA' || s === 'APROBADA' || s === 'REVISION_PAGO') return 2;
  if (s === 'ASIGNADA' || s === 'ASIGNADO') return 1;
  return 0;
};

// Componente B: Estado Financiero (Desvinculado del Flujo Operativo)
const FinancialStatusCard = ({ request, totalAmount, totalPaid, remainingBalance }) => {
  const getFinancialStatusInfo = () => {
    const estadoPago = (request?.estado_pago || '').toString().toUpperCase();
    const tipoPago = (request?.tipo_pago || '').toString().toUpperCase();
    const rawStatus = (request?.statusRaw || request?.status || '').toString().toUpperCase();

    // 1. Pagado / Liquidado (Verde Esmeralda)
    const isFullyPaid =
      (estadoPago === 'COMPLETADO' && (tipoPago === 'FINAL' || tipoPago === 'TOTAL')) ||
      estadoPago === 'PAGADO' ||
      estadoPago === 'LIQUIDADO' ||
      (totalAmount > 0 && remainingBalance <= 0.01 && totalPaid >= totalAmount - 0.01);

    if (isFullyPaid) {
      return {
        key: 'PAGADO',
        label: 'Pagado / Liquidado',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
        cardBorder: 'border-emerald-200/80',
        iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        description: 'El monto del servicio se encuentra 100% pagado y liquidado.'
      };
    }

    // 2. Adelanto confirmado (Ámbar / Amarillo)
    const isAdvanceConfirmed =
      estadoPago === 'ADELANTO' ||
      tipoPago === 'ADELANTO' ||
      rawStatus === 'APROBADA' ||
      (totalPaid > 0 && remainingBalance > 0.01);

    if (isAdvanceConfirmed) {
      return {
        key: 'ADELANTO',
        label: 'Adelanto confirmado',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
        cardBorder: 'border-amber-200/80',
        iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
        description: 'Adelanto registrado. Saldo pendiente al finalizar la asistencia.'
      };
    }

    // 3. Pendiente de pago (Gris Neutro)
    return {
      key: 'PENDIENTE_PAGO',
      label: 'Pendiente de pago',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      dotClass: 'bg-slate-400',
      cardBorder: 'border-slate-200/70',
      iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
      description: totalAmount > 0
        ? 'En espera de confirmación de pago para proceder con el servicio.'
        : 'Cotización sujeta a evaluación técnica previa al cobro.'
    };
  };

  const statusInfo = getFinancialStatusInfo();
  const progressPercent = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0;

  return (
    <div className={`w-full h-full bg-white/95 backdrop-blur-lg border ${statusInfo.cardBorder} rounded-3xl p-6 md:p-7 shadow-soft flex flex-col justify-between transition-soft`}>
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2.5 rounded-2xl border ${statusInfo.iconBg}`}>
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400">
                Estado Financiero
              </h3>
              <p className="font-extrabold text-slate-800 text-sm">Resumen de Pagos</p>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold border ${statusInfo.badgeClass}`}>
            <span className={`w-2 h-2 rounded-full mr-2 shrink-0 ${statusInfo.dotClass}`}></span>
            {statusInfo.label}
          </span>
          <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
            {statusInfo.description}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100/80 space-y-3">
        {totalAmount > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Cotizado</span>
                <span className="font-bold text-slate-800">S/ {totalAmount.toFixed(2)}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Abonado</span>
                <span className="font-bold text-emerald-600">S/ {totalPaid.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-500">Saldo Pendiente:</span>
                <span className={remainingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                  S/ {remainingBalance.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 rounded-full ${
                    statusInfo.key === 'PAGADO'
                      ? 'bg-emerald-500'
                      : statusInfo.key === 'ADELANTO'
                      ? 'bg-amber-500'
                      : 'bg-slate-300'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <div className="p-3 rounded-xl border border-slate-200/60 bg-slate-50 flex justify-between items-center text-xs shadow-soft-sm">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Adelanto Mínimo (30%)</p>
                  <p className="font-black text-slate-800 mt-0.5">S/ {(totalAmount * 0.30).toFixed(2)}</p>
                </div>
                <div>
                  {totalPaid >= (totalAmount * 0.30) - 0.01 ? (
                    <span className="bg-emerald-50 text-emerald-600 text-[9px] font-extrabold px-2 py-0.5 rounded border border-emerald-100 uppercase flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Abonado
                    </span>
                  ) : totalPaid > 0 ? (
                    <span className="bg-indigo-50 text-indigo-600 text-[9px] font-extrabold px-2 py-0.5 rounded border border-indigo-100 uppercase flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> Parcial
                    </span>
                  ) : (
                    <span className="bg-amber-50 text-amber-600 text-[9px] font-extrabold px-2 py-0.5 rounded border border-amber-100 uppercase flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> Pendiente
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/60 bg-slate-50 flex justify-between items-center text-xs shadow-soft-sm">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Saldo Restante (50%)</p>
                  <p className="font-black text-slate-800 mt-0.5">S/ {(totalAmount * 0.50).toFixed(2)}</p>
                </div>
                <div>
                  {totalPaid >= totalAmount - 0.01 ? (
                    <span className="bg-emerald-50 text-emerald-600 text-[9px] font-extrabold px-2 py-0.5 rounded border border-emerald-100 uppercase flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Cancelado
                    </span>
                  ) : (
                    <span className="bg-rose-50 text-rose-600 text-[9px] font-extrabold px-2 py-0.5 rounded border border-rose-100 uppercase flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Faltante
                    </span>
                  )}
                </div>
              </div>
            </div>

            {payments.length === 0 ? (
              <div className="text-center p-3 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="text-[11px] font-semibold text-slate-500">Aún no se ha registrado el comprobante de pago.</p>
              </div>
            ) : (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Historial de Transacciones</h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {payments.map(pago => {
                    const isVerified = pago.estado === 'VERIFICADO' || pago.estado === 'Aprobado' || pago.estado === 'COMPLETADO';
                    const isRejected = pago.estado === 'RECHAZADO';
                    return (
                      <div key={pago.id_pago || pago.id || Math.random()} className="flex items-center justify-between p-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded-lg ${
                            isVerified ? 'bg-emerald-100 text-emerald-600' :
                            isRejected ? 'bg-rose-100 text-rose-600' :
                            'bg-amber-100 text-amber-600'
                          }`}>
                            {isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : isRejected ? <XCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className={`text-[11px] font-bold ${isRejected ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                              S/ {parseFloat(pago.monto_pagado || pago.monto || 0).toFixed(2)}
                            </p>
                            <p className="text-[9px] text-slate-400">{pago.metodo_pago || 'Transferencia'}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                          isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          isRejected ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {pago.estado === 'PENDIENTE' ? 'En Revisión' : pago.estado || 'Pendiente'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/80 text-center">
            <p className="text-xs font-semibold text-slate-600">Sin cotización generada</p>
            <p className="text-[11px] text-slate-400 mt-0.5">El importe se definirá tras la revisión técnica.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente A: Flujo Operativo (Stepper Horizontal de Progreso Técnico)
const OperationalStepper = ({ request, currentOperationalIndex }) => {
  return (
    <div className="w-full h-full bg-white/95 backdrop-blur-lg border border-slate-200/70 rounded-3xl p-6 md:p-8 shadow-soft flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400">
              Flujo Operativo
            </h3>
            <p className="font-extrabold text-slate-800 text-sm md:text-base">
              Progreso Técnico de la Solicitud
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
            Etapa {currentOperationalIndex + 1} de {OPERATIONAL_STAGES.length}: {OPERATIONAL_STAGES[currentOperationalIndex]?.label || 'Pendiente'}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6 relative my-auto">
        {OPERATIONAL_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentOperationalIndex;
          const isActive = idx === currentOperationalIndex;

          return (
            <div key={idx} className="flex md:flex-col items-center flex-1 w-full relative">
              {idx < OPERATIONAL_STAGES.length - 1 && (
                <div className="hidden md:block absolute left-[50%] top-4 w-[100%] h-0.5 bg-slate-100">
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
              <div className="ml-4 md:ml-0 md:text-center mt-0 md:mt-3 text-left">
                <h4
                  className={`text-xs font-bold ${
                    isActive ? 'text-indigo-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{stage.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RequestTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evidences, setEvidences] = useState([]);
  const [isEvidencesSupported, setIsEvidencesSupported] = useState(true);
  const [evidencesError, setEvidencesError] = useState(null);

  // Estados para Registro de Adelanto
  const [isQuotationAccepted, setIsQuotationAccepted] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA');
  const [paymentOperation, setPaymentOperation] = useState('');
  const [paymentFile, setPaymentFile] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [bankAccount, setBankAccount] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  // Carga de datos de la solicitud
  const loadRequest = async () => {
    try {
      const data = await api.requests.getById(id);
      setRequest(data);

      if (data.statusRaw === 'COTIZADA') {
        try {
          const bankData = await api.finances.getBankAccount();
          setBankAccount(bankData);
        } catch (bankErr) {
          console.warn("No se pudieron cargar datos bancarios", bankErr);
        }
      }
      // Cargar evidencias con tolerancia a fallos
      try {
        const evData = await api.evidences.getByRequest(id);
        setEvidences(evData);
      } catch(evErr) {
        console.warn("No se pudieron cargar evidencias", evErr);
        if (evErr.isUnsupported) {
          setIsEvidencesSupported(false);
        } else if (evErr.isTemporaryUnavailable) {
          setEvidencesError('Las evidencias no están disponibles temporalmente.');
        } else {
          setEvidencesError('No se pudieron cargar las evidencias adjuntas.');
        }
      }

      // Cargar pagos de la solicitud
      let fetchedPayments = [];
      try {
        const payData = await api.finances.getPaymentsByRequest(id);
        fetchedPayments = Array.isArray(payData) ? payData : (payData?.data || []);
      } catch (payErr) {
        console.warn("No se pudieron cargar los pagos, aplicando inferencia si es posible", payErr);
      }

      // Fallback: Inferir pagos si el backend no los provee pero el estado confirma que ya se pagaron
      if (fetchedPayments.length === 0 && data.quotation && data.quotation.total) {
        const totalCotizacion = parseFloat(data.quotation.total);
        const st = data.statusRaw || '';
        const isFinalizado = st.toUpperCase() === 'FINALIZADA' || st.toUpperCase() === 'FINALIZADO' || (data.status || '').toLowerCase() === 'finalizado' || (data.status || '').toLowerCase() === 'finalizada';
        const isAprobado = st.toUpperCase() === 'APROBADA' || st.toUpperCase() === 'EN_PROCESO' || (data.status || '').toLowerCase() === 'aprobado' || (data.status || '').toLowerCase() === 'en curso';
        
        if (isFinalizado) {
          fetchedPayments = [
            { id_pago: 'auto-1', concepto: 'Adelanto (50%)', monto_pagado: totalCotizacion * 0.5, estado: 'COMPLETADO', metodo_pago: 'Transferencia', nro_operacion: 'Validado' },
            { id_pago: 'auto-2', concepto: 'Saldo (50%)', monto_pagado: totalCotizacion * 0.5, estado: 'COMPLETADO', metodo_pago: 'Transferencia', nro_operacion: 'Validado' }
          ];
        } else if (isAprobado) {
          fetchedPayments = [
            { id_pago: 'auto-1', concepto: 'Adelanto (50%)', monto_pagado: totalCotizacion * 0.5, estado: 'COMPLETADO', metodo_pago: 'Transferencia', nro_operacion: 'Validado' }
          ];
        }
      }

      setPayments(fetchedPayments);
    } catch (err) {
      setError(err.message || 'Error al obtener la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [id]);

  // Cancelar (Soft delete)
  const handleCancelRequest = async () => {
    if (!window.confirm('¿Está seguro de que desea anular esta solicitud técnica?')) return;
    try {
      await api.requests.cancel(id);
      await loadRequest();
    } catch (err) {
      alert(err.message || 'Error al cancelar la solicitud');
    }
  };

  // Rechazar cotización
  const handleRejectQuotation = async () => {
    const reason = window.prompt('Indique el motivo por el cual rechaza la cotización:');
    if (reason === null) return;
    if (reason.trim() === '') {
      alert('Debe ingresar un motivo válido.');
      return;
    }
    
    try {
      await api.requests.rejectQuotation(id, reason);
      await loadRequest();
    } catch (err) {
      alert(err.message || 'Error al rechazar la cotización.');
    }
  };

  // Registrar Pago (30% mínimo hasta 100% Liquidación, con comprobante opcional/Cloudinary)
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
      alert('Por favor, ingrese un monto válido.');
      return;
    }
    const totalAmount = request?.quotation?.total || 0;
    const minAdvance = totalAmount * 0.30;
    if (totalAmount > 0 && Number(paymentAmount) < minAdvance - 0.01) {
      alert(`El pago mínimo permitido es el 30% del total (S/ ${minAdvance.toFixed(2)}). Puede abonar desde el 30% hasta el 100% para liquidación total.`);
      return;
    }
    if (!paymentOperation && !paymentFile) {
      alert('Debe ingresar el número de operación o adjuntar el comprobante de pago.');
      return;
    }

    setSubmittingPayment(true);
    try {
      const result = await api.finances.registerAdvance(id, {
        monto_pagado: Number(paymentAmount),
        metodo_pago: paymentMethod,
        nro_operacion: paymentOperation || 'Adjunto',
        comprobanteFile: paymentFile
      });

      if (Number(paymentAmount) >= totalAmount - 0.01 || result?.es_liquidacion_total) {
        alert('¡Liquidación Total (100%)! Has completado el pago de la cotización exitosamente.');
      } else {
        alert('¡Pago registrado exitosamente! Su comprobante está en revisión.');
      }
      await loadRequest();
      
      setPaymentAmount('');
      setPaymentOperation('');
      setPaymentFile(null);
    } catch (err) {
      alert(err.message || 'Error al registrar el pago.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const isCancelled =
    request &&
    ['CANCELADA', 'CANCELADO', 'ANULADA', 'RECHAZADA'].includes(
      (request.statusRaw || request.status || '').toString().toUpperCase()
    );

  const currentOperationalIndex = request ? getOperationalStageIndex(request.statusRaw || request.status) : 0;

  const totalAmount = request?.quotation ? parseFloat(request.quotation.total || request.quotation.monto_total || 0) : 0;
  const totalPaid = payments
    .filter(p => p.estado !== 'RECHAZADO' && p.estado !== 'CANCELADO' && p.estado !== 'Rechazado' && p.estado !== 'Cancelado')
    .reduce((sum, p) => sum + parseFloat(p.monto_pagado || p.monto || 0), 0);
  const remainingBalance = Math.max(0, totalAmount - totalPaid);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans">
        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs mt-3">Sincronizando con GPS y base de datos...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="bg-white border border-slate-200/60 rounded-3xl p-10 text-center font-sans space-y-4 shadow-soft">
        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-100">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-slate-800 text-sm">Ocurrió un error</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">{error || 'La solicitud no existe o no tiene permisos de acceso.'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-soft cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in">
      
      {/* Cabecera del Servicio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 bg-white border border-slate-200/60 text-slate-500 hover:text-slate-800 rounded-xl shadow-soft-sm transition-soft cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-display font-extrabold text-xl md:text-2xl text-slate-900">
                Seguimiento de Asistencia
              </h1>
              {request.isEmergency && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> URGENTE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Tipo: {request.type}</p>
          </div>
        </div>

        {/* Cancelación Soft Delete */}
        {request.status.toLowerCase() === 'pendiente' && (
          <button
            onClick={handleCancelRequest}
            className="inline-flex items-center px-4 py-2 border border-rose-200 bg-white hover:bg-rose-50 text-rose-500 text-xs font-semibold rounded-xl transition-soft cursor-pointer"
          >
            <XCircle className="w-4 h-4 mr-1.5" /> Anular Solicitud
          </button>
        )}
      </div>

      {/* 1. SEPARACIÓN VISUAL: FLUJO OPERATIVO Y ESTADO FINANCIERO */}
      {isCancelled ? (
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 flex items-start space-x-3 text-rose-800 animate-slide-up">
          <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Esta solicitud ha sido Anulada</h4>
            <p className="text-xs text-rose-600 mt-1 leading-normal">
              La solicitud fue cancelada por el cliente y no generará cargos. Los registros quedan archivados en su historial operativo para fines de auditoría.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
          {/* Componente A: Flujo Operativo (2 Columnas en lg) */}
          <div className="lg:col-span-2 flex">
            <OperationalStepper request={request} currentOperationalIndex={currentOperationalIndex} />
          </div>

          {/* Componente B: Estado Financiero (1 Columna en lg) */}
          <div className="lg:col-span-1 flex">
            <FinancialStatusCard
              request={request}
              totalAmount={totalAmount}
              totalPaid={totalPaid}
              remainingBalance={remainingBalance}
            />
          </div>
        </div>
      )}

      {/* Fila inferior: Detalles y Técnico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Principal (Detalles) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-soft space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-800">Descripción del Reporte</h3>
            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100/60">
              {request.description || request.descripcion_problema || request.descripcion || request.detalle || 'Sin descripción detallada registrada'}
            </p>
            {request.materiales_cliente && (
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 space-y-1 mt-3">
                <span className="font-bold block text-blue-700 uppercase tracking-wider text-[10px]">Materiales aportados por el cliente</span>
                <p className="leading-relaxed">{request.materiales_cliente}</p>
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-500 border-t border-slate-100">
              <span className="flex items-center">
                <MapPin className="w-4 h-4 text-slate-400 mr-1.5" /> {request.location?.address || request.direccion_servicio || request.direccion || 'Dirección no especificada'}
              </span>
              {request.scheduledDate && (
                <span className="flex items-center">
                  <Clock className="w-4 h-4 text-slate-400 mr-1.5" /> Programado: {request.scheduledDate} ({request.scheduledTime})
                </span>
              )}
            </div>
          </div>

          {/* COTIZACIÓN */}
          {request.quotation && (
            <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-soft space-y-6 relative overflow-hidden animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-soft-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-800 text-base md:text-lg">
                      Cotización de Servicio
                    </h3>
                    <p className="text-[11px] text-slate-400">Presupuesto detallado y desglose de asistencia técnica</p>
                  </div>
                </div>
                <div>
                  <span className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border-2 ${
                    request.quotation.status === 'APROBADA'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : request.quotation.status === 'ENVIADA'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      request.quotation.status === 'APROBADA'
                        ? 'bg-emerald-500'
                        : request.quotation.status === 'ENVIADA'
                        ? 'bg-indigo-500 animate-pulse'
                        : 'bg-amber-500'
                    }`}></span>
                    {request.quotation.status}
                  </span>
                </div>
              </div>

              {/* Tabla de ítems si existen */}
              {request.quotation.items && request.quotation.items.length > 0 && (
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-soft-sm">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-widest text-[9px]">
                      <tr>
                        <th className="px-5 py-4">Concepto / Descripción</th>
                        <th className="px-4 py-4 text-center">Cantidad</th>
                        <th className="px-5 py-4 text-right">P. Unitario</th>
                        <th className="px-5 py-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {request.quotation.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 font-semibold text-slate-800">
                            {item.item_catalogo?.nombre || item.item_catalogo?.descripcion || item.descripcion || item.nombre_item || `Ítem #${item.id_item || idx + 1}`}
                          </td>
                          <td className="px-4 py-4 text-center font-bold text-slate-500">{Number(item.cantidad || 1).toFixed(2)}</td>
                          <td className="px-5 py-4 text-right font-semibold text-slate-600">S/ {Number(item.precio_aplicado || item.precio_unitario || 0).toFixed(2)}</td>
                          <td className="px-5 py-4 text-right font-extrabold text-slate-800">S/ {Number(item.subtotal || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totales en Tema Claro y Bordes Enfatizados */}
              <div className="p-6 bg-slate-50/60 border border-slate-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="flex flex-wrap items-center gap-6 md:gap-8 z-10 w-full md:w-auto">
                  <div className="min-w-[90px]">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Subtotal</span>
                    <span className="text-sm font-bold text-slate-700 mt-0.5 block">S/ {Number(request.quotation.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                  <div className="min-w-[90px]">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">IGV (18%)</span>
                    <span className="text-sm font-bold text-slate-700 mt-0.5 block">S/ {Number(request.quotation.igv || 0).toFixed(2)}</span>
                  </div>
                  <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                  <div className="border-t border-slate-200/60 pt-3 md:pt-0 md:border-t-0 md:border-l md:border-slate-200 md:pl-8 min-w-[140px]">
                    <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block">Monto Total</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tight mt-0.5 block">S/ {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>


              
              {request.statusRaw === 'COTIZADA' && !isQuotationAccepted && (
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setIsQuotationAccepted(true);
                      if (request?.quotation?.total) {
                        setPaymentAmount((parseFloat(request.quotation.total) * 0.5).toFixed(2));
                      }
                    }}
                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-soft hover-lift cursor-pointer flex items-center justify-center space-x-2 transition-soft border border-indigo-700"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprobar Cotización y Pagar</span>
                  </button>
                  <button
                    onClick={handleRejectQuotation}
                    className="flex-1 py-3.5 bg-rose-50 hover:bg-rose-100/80 text-rose-600 font-bold text-xs rounded-xl transition-soft cursor-pointer border border-rose-200/60 flex items-center justify-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rechazar Presupuesto</span>
                  </button>
                </div>
              )}

              {request.statusRaw === 'COTIZADA' && isQuotationAccepted && (
                <div className="pt-5 border-t border-slate-150 animate-slide-up space-y-4">
                  <div className="flex items-center space-x-2 pb-2">
                    <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Registrar Adelanto (50%)</h4>
                  </div>

                  {bankAccount && (
                    <div className="mb-6 p-6 bg-white border-2 border-indigo-100 rounded-2xl space-y-4 text-xs text-slate-600 relative overflow-hidden animate-fade-in shadow-soft-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h5 className="font-bold text-slate-800 flex items-center text-xs md:text-sm">
                          <CreditCard className="w-4.5 h-4.5 mr-2 text-indigo-600 shrink-0" />
                          Datos para Transferencia Bancaria
                        </h5>
                        <span className="text-[9px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-150">
                          Recaudación Directa
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Titular de la Cuenta</span>
                          <span className="font-bold text-slate-800 text-xs">{bankAccount.titular}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Entidad Financiera</span>
                          <span className="font-bold text-slate-800 text-xs">{bankAccount.banco}</span>
                        </div>
                        <div className="space-y-1 relative">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Nro. de Cuenta ({bankAccount.tipo_cuenta})</span>
                          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                            <span className="font-mono text-slate-800 font-bold tracking-wider text-xs">{bankAccount.numero_cuenta}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(bankAccount.numero_cuenta, 'cuenta')}
                              className="p-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 transition-soft cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                              title="Copiar Nro de Cuenta"
                            >
                              {copiedField === 'cuenta' ? <Check className="w-3.5 h-3.5 text-emerald-500 animate-scale-in" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            {copiedField === 'cuenta' && (
                              <span className="text-[9px] font-bold text-emerald-600 animate-fade-in absolute right-10 top-[22px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                ¡Copiado!
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1 relative">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Código de Cuenta Interbancario (CCI)</span>
                          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                            <span className="font-mono text-slate-800 font-bold tracking-wider text-xs">{bankAccount.cci}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(bankAccount.cci, 'cci')}
                              className="p-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 transition-soft cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                              title="Copiar CCI"
                            >
                              {copiedField === 'cci' ? <Check className="w-3.5 h-3.5 text-emerald-500 animate-scale-in" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            {copiedField === 'cci' && (
                              <span className="text-[9px] font-bold text-emerald-600 animate-fade-in absolute right-10 top-[22px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                ¡Copiado!
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Moneda</span>
                          <span className="font-bold text-slate-800 text-xs">{bankAccount.moneda}</span>
                        </div>
                      </div>
                      <div className="bg-indigo-50/50 border border-indigo-100/30 p-2.5 rounded-xl text-[10px] text-indigo-700 font-semibold flex items-center space-x-1.5 mt-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                        <span>{bankAccount.mensaje}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmitPayment} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monto a Depositar (S/)</label>
                        <div className="relative rounded-xl shadow-soft-sm">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-soft"
                            placeholder="Ej: 100.00"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Método de Pago</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <CreditCard className="w-4 h-4 text-slate-400" />
                          </div>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-soft appearance-none cursor-pointer"
                          >
                            <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Número de Operación (Opcional si adjunta foto)</label>
                      <div className="relative rounded-xl shadow-soft-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Hash className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          value={paymentOperation}
                          onChange={(e) => setPaymentOperation(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-soft"
                          placeholder="Ej: 351-98765432"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Adjuntar Comprobante (Cloudinary)</label>
                      <div className="relative rounded-xl border border-dashed border-slate-300 p-3 bg-slate-50 hover:bg-slate-100 transition-soft">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                          className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                        {paymentFile && (
                          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                            ✓ {paymentFile.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setIsQuotationAccepted(false)}
                        disabled={submittingPayment}
                        className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-500 font-bold text-xs rounded-xl transition-soft cursor-pointer border border-slate-200 disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-soft-sm"
                      >
                        <span>Volver</span>
                      </button>
                      <button
                        type="submit"
                        disabled={submittingPayment}
                        className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-soft cursor-pointer disabled:opacity-50 flex justify-center items-center space-x-1.5 shadow-soft border border-indigo-700 hover-lift"
                      >
                        {submittingPayment ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Registrando...</span>
                          </>
                        ) : (
                          <>
                            <span>Registrar Pago de Adelanto</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

           {/* EVIDENCIAS CON NOTAS (Degradación Progresiva) */}
           {isEvidencesSupported && (evidencesError || (evidences && evidences.length > 0)) && (
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-soft space-y-4">
                <h3 className="font-display font-bold text-sm text-slate-800 flex items-center">
                  <Camera className="w-4.5 h-4.5 text-slate-400 mr-2" /> Evidencias Adjuntas y Observaciones del Técnico
                </h3>
                {evidencesError ? (
                  <div className="bg-amber-50 text-amber-700 p-4 rounded-xl border border-amber-100 flex items-center text-xs">
                    <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
                    <p>{evidencesError}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {evidences.map((ev, idx) => (
                      <div key={ev.id_evidencia || idx} className="rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-soft-sm flex flex-col">
                        <div className="h-36 bg-slate-100 relative">
                          {ev.tipo_archivo?.startsWith('image') || ev.url_archivo?.match(/\.(jpg|jpeg|png|webp|gif)$/i) || !ev.tipo_archivo ? (
                            <img 
                              src={ev.url_archivo} 
                              alt={ev.observaciones || ev.descripcion || 'Evidencia'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                              <Camera className="w-6 h-6 mb-2" />
                              <span className="text-[10px] uppercase font-bold">{ev.tipo_archivo || 'Archivo'}</span>
                            </div>
                          )}
                          {ev.tipo_evidencia && (
                            <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase">
                              {ev.tipo_evidencia.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        {(ev.observaciones || ev.descripcion) && (
                          <div className="p-3 bg-slate-50 border-t border-slate-100 flex-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Observación del técnico</span>
                            <p className="text-xs text-slate-700 italic mt-0.5">
                              "{ev.observaciones || ev.descripcion}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
           )}

           {/* TIMELINE DE CAMBIOS DE ESTADO */}
           {request.timeline && request.timeline.length > 0 && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-soft space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-800">
                    Historial y Timeline de Estado
                  </h3>
                  <p className="text-[11px] text-slate-400">Trazabilidad cronológica de la solicitud</p>
                </div>
              </div>
              <div className="space-y-4 pt-2">
                {request.timeline.map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-100"></div>
                      {idx < request.timeline.length - 1 && (
                        <div className="w-0.5 h-10 bg-slate-200 my-1"></div>
                      )}
                    </div>
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          {item.estado_anterior || 'Inicio'} → {item.estado_nuevo}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.fecha_cambio}
                        </span>
                      </div>
                      {item.usuario_accion && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Por: <span className="font-semibold text-slate-700">{item.usuario_accion}</span> ({item.rol_usuario || 'USUARIO'})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
           )}
        </div>

        {/* Columna Lateral (Técnico y ETA) */}
        <div className="space-y-6">
          {request.technician ? (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-soft space-y-4">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400">Especialista Asignado</h3>
              
              <div className="flex items-center space-x-3.5">
                <img 
                  src={request.technician.photo} 
                  alt="Técnico" 
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-soft-sm"
                />
                <div className="flex-1 text-left min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{request.technician.name}</h4>
                </div>
              </div>

              {request.status.toLowerCase() !== 'finalizado' && request.technician.eta && (
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs text-indigo-700">
                  <span className="font-semibold">Tiempo Estimado (ETA):</span>
                  <span className="font-bold text-sm animate-pulse">{request.technician.eta}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehículo:</span>
                  <span className="font-semibold text-slate-700">{request.technician.vehicle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Placa:</span>
                  <span className="font-mono font-bold text-slate-700">{request.technician.plate}</span>
                </div>
              </div>

              {request.status.toLowerCase() !== 'finalizado' && request.technician.phone && (
                <a
                  href={`tel:${request.technician.phone}`}
                  className="w-full flex items-center justify-center py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50 font-semibold text-xs rounded-xl transition-soft cursor-pointer"
                >
                  <Phone className="w-4 h-4 mr-1.5 text-slate-500" /> Llamar Especialista
                </a>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-soft text-center space-y-3.5">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                <Activity className="w-5 h-5 animate-pulse text-indigo-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-xs">Asignando Especialista</h4>
                <p className="text-[11px] text-slate-400 leading-normal mt-1">
                  Analizando disponibilidad técnica y cercanía de operarios homologados en su distrito.
                </p>
              </div>
            </div>
          )}

          <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-3xl space-y-2 text-xs">
            <span className="font-bold text-slate-700 text-xs">Ayuda de SIGESTO</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              ¿Tienes consultas sobre el presupuesto o discrepancias en la atención? Contáctanos de inmediato.
            </p>
            <div className="pt-1.5">
              <span className="font-mono font-bold text-indigo-600 block text-xs">☎ Soporte: 01 445-5656</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default RequestTracking;
