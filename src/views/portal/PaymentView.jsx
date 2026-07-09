import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  CreditCard, 
  CheckCircle2, 
  History, 
  ArrowRight,
  ShieldCheck,
  Building,
  Upload,
  DollarSign,
  Hash,
  Clock
} from 'lucide-react';

const PaymentView = () => {
  const [requests, setRequests] = useState([]);
  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const [bankAccount, setBankAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showGateway, setShowGateway] = useState(false);
  const [isPaymentsSupported, setIsPaymentsSupported] = useState(true);
  const [paymentsError, setPaymentsError] = useState(null);

  // Estados del Formulario de Adelanto
  const [monto, setMonto] = useState('');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [urlComprobante, setUrlComprobante] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [advanceError, setAdvanceError] = useState('');
  const [comprobanteFile, setComprobanteFile] = useState(null);

  const fetchData = async () => {
    try {
      const data = await api.requests.getAll();
      setRequests(data);
      try {
        const bankData = await api.finances.getBankAccount();
        setBankAccount(bankData);
      } catch (bkErr) {
         console.warn("No se pudo obtener cuenta bancaria", bkErr);
         if (bkErr.isUnsupported) {
           setIsPaymentsSupported(false);
         } else if (bkErr.isTemporaryUnavailable) {
           setPaymentsError('El servicio de pagos no está disponible temporalmente.');
         }
      }
      let fetchedHistory = [];
      try {
        const histData = await api.finances.getAllMyPayments();
        fetchedHistory = Array.isArray(histData) ? histData : (histData?.data || []);
      } catch (histErr) {
        console.warn("No se pudo obtener historial de pagos, aplicando inferencia si es posible", histErr);
      }

      if (fetchedHistory.length === 0) {
        data.forEach(req => {
          const st = req.statusRaw || '';
          const isFinalizado = st.toUpperCase() === 'FINALIZADA' || st.toUpperCase() === 'FINALIZADO' || (req.status || '').toLowerCase() === 'finalizado' || (req.status || '').toLowerCase() === 'finalizada';
          const isAprobado = st.toUpperCase() === 'APROBADA' || st.toUpperCase() === 'EN_PROCESO' || (req.status || '').toLowerCase() === 'aprobado' || (req.status || '').toLowerCase() === 'en curso';
          const totalCotizacion = req.quotation?.total ? parseFloat(req.quotation.total) : 0;
          
          if (totalCotizacion > 0) {
            if (isFinalizado) {
              fetchedHistory.push({ id_pago: `auto-1-${req.id}`, concepto: `Adelanto`, monto: totalCotizacion * 0.5, estado: 'COMPLETADO', metodo_pago: 'Transferencia', nro_operacion: 'Validado', solicitud: { tipo_servicio: req.type, id_solicitud: req.id }, created_at: req.createdAt });
              fetchedHistory.push({ id_pago: `auto-2-${req.id}`, concepto: `Saldo Faltante`, monto: totalCotizacion * 0.5, estado: 'COMPLETADO', metodo_pago: 'Transferencia', nro_operacion: 'Validado', solicitud: { tipo_servicio: req.type, id_solicitud: req.id }, created_at: new Date().toISOString() });
            } else if (isAprobado) {
              fetchedHistory.push({ id_pago: `auto-1-${req.id}`, concepto: `Adelanto`, monto: totalCotizacion * 0.5, estado: 'COMPLETADO', metodo_pago: 'Transferencia', nro_operacion: 'Validado', solicitud: { tipo_servicio: req.type, id_solicitud: req.id }, created_at: req.createdAt });
            }
          }
        });
      }
      setPaymentsHistory(fetchedHistory);
    } catch (err) {
      console.error(err);
      if (err.isTemporaryUnavailable) {
        setPaymentsError('No se pudo cargar la información de facturación (Error 500).');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openPaymentModal = (req) => {
    setSelectedRequest(req);
    setShowGateway(true);
    setPaymentSuccess(false);
    setProcessing(false);
    setAdvanceError('');
    setMonto(req.quotation?.total ? (parseFloat(req.quotation.total) * 0.30).toFixed(2) : '');
    setNumeroOperacion('');
    setMetodoPago('TRANSFERENCIA');
    setUrlComprobante('');
    setComprobanteFile(null);
  };

  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();
    setAdvanceError('');
    if (!monto || (!numeroOperacion && !comprobanteFile && !urlComprobante) || !metodoPago) {
      setAdvanceError('Por favor ingrese el monto, método de pago y el número de operación o comprobante.');
      return;
    }

    const numericMonto = parseFloat(monto);
    const totalAmount = selectedRequest?.quotation?.total || 0;
    const minAmount = totalAmount * 0.30;

    if (totalAmount > 0 && (numericMonto < minAmount - 0.01 || numericMonto > totalAmount + 0.01)) {
      setAdvanceError(`El monto debe estar entre el 30% (S/ ${minAmount.toFixed(2)}) y el 100% (S/ ${totalAmount.toFixed(2)}).`);
      return;
    }

    setProcessing(true);
    try {
      await api.finances.registerAdvance(selectedRequest.id, { 
        monto: parseFloat(monto), 
        numero_operacion: numeroOperacion || 'Adjunto', 
        metodo_pago: metodoPago,
        url_comprobante: urlComprobante || 'Cloudinary',
        comprobanteFile: comprobanteFile
      });
      setPaymentSuccess(true);
      await fetchData();
    } catch (err) {
      if (err.isUnsupported) {
        alert('El registro de pagos no está soportado en esta versión del backend.');
        setIsPaymentsSupported(false);
        setShowGateway(false);
      } else if (err.isTemporaryUnavailable) {
        alert('Servicio temporalmente no disponible (Error 500). Intente más tarde.');
      } else {
        alert(err.message || 'Error al registrar el pago.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
  };

  const pendingRequests = requests.filter(r => {
    if (!r.quotation?.total) return false;
    const st = (r.statusRaw || '').toUpperCase();
    const isCotizada = st === 'COTIZADA' || r.quotation?.status === 'Aprobada';
    const isSaldoPendiente = st === 'APROBADA' || st === 'EN_PROCESO' || (r.status || '').toLowerCase() === 'aprobado' || (r.status || '').toLowerCase() === 'en curso';
    return isCotizada || isSaldoPendiente;
  });

  const groupedPayments = paymentsHistory.reduce((acc, pago) => {
    const sId = pago.solicitud?.id_solicitud || pago.solicitud?.uuid_solicitud || pago.id_solicitud || pago.solicitud_id || 'otros';
    if (!acc[sId]) acc[sId] = [];
    acc[sId].push(pago);
    return acc;
  }, {});

  return (
    <div className="space-y-6 text-left font-sans">
      <div>
        <h1 className="font-display font-extrabold text-xl md:text-2xl text-slate-900">
          Facturación y Adelantos
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Registre sus transferencias bancarias de cotizaciones aprobadas.</p>
      </div>

      {!isPaymentsSupported ? (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-10 text-center shadow-soft">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100 mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">Módulo de Pagos Desactivado</h4>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
            Esta versión del portal no incluye el módulo de pagos en línea o registro de transferencias. Comuníquese directamente con la central para coordinar sus pagos.
          </p>
        </div>
      ) : paymentsError ? (
        <div className="bg-white border border-rose-200/60 rounded-3xl p-10 text-center shadow-soft">
          <p className="text-sm font-semibold text-rose-600">{paymentsError}</p>
          <p className="text-xs text-slate-500 mt-2">Por favor, intente acceder más tarde.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-800 flex items-center">
              <CreditCard className="w-4.5 h-4.5 text-indigo-500 mr-2" /> Cotizaciones por Pagar
            </h3>

            {loading ? (
              <div className="bg-white border border-slate-200/60 rounded-3xl p-10 text-center shadow-soft">
                <div className="inline-block w-6 h-6 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 text-xs mt-3">Obteniendo estados de facturación...</p>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="bg-white border border-slate-200/60 rounded-3xl p-8 text-center shadow-soft space-y-3.5">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Al día con sus pagos</h4>
                  <p className="text-[11px] text-slate-400 leading-normal mt-0.5">No tiene facturas pendientes de aprobación o pago en este momento.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingRequests.map((item) => {
                  const st = (item.statusRaw || '').toUpperCase();
                  const isCotizada = st === 'COTIZADA' || item.quotation?.status === 'Aprobada';
                  const isSaldoPendiente = st === 'APROBADA' || st === 'EN_PROCESO' || (item.status || '').toLowerCase() === 'aprobado' || (item.status || '').toLowerCase() === 'en curso';
                  const montoMitad = parseFloat(item.quotation.total) * 0.5;

                  const cardBorderColor = isCotizada ? 'border-amber-200/60' : 'border-indigo-200/60';
                  const headerBgColor = isCotizada ? 'bg-amber-50/50 border-amber-100' : 'bg-indigo-50/50 border-indigo-100';
                  const labelColor = isCotizada ? 'text-amber-600' : 'text-indigo-600';
                  const labelText = isCotizada ? 'Adelanto Pendiente' : 'Saldo Pendiente';

                  return (
                    <div key={item.id} className={`bg-white border ${cardBorderColor} rounded-3xl overflow-hidden shadow-soft-sm text-xs`}>
                      <div className={`${headerBgColor} border-b px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                         <div>
                           <span className="font-bold text-slate-800 text-sm block">{item.type}</span>
                           <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Ref: {item.id}</span>
                           <p className="text-[11px] text-slate-500 mt-1.5 max-w-md line-clamp-2">{item.description}</p>
                         </div>
                         <div className="text-left sm:text-right shrink-0">
                           <span className={`text-[10px] font-extrabold uppercase tracking-widest block ${labelColor}`}>{labelText}</span>
                           <span className="text-sm font-black text-rose-500 block mt-0.5">{formatCurrency(montoMitad)}</span>
                         </div>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {isCotizada && (
                          <div className="p-4 hover:bg-slate-50/50 transition-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1 text-left min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="bg-amber-50 text-amber-600 text-[9px] font-extrabold px-2 py-0.5 rounded border border-amber-100 uppercase">Cotización Aprobada</span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-sm mt-1">Adelanto Requerido (50%)</h4>
                              <p className="text-[10px] text-slate-400">Monto necesario para iniciar el servicio</p>
                            </div>
                            <div className="flex items-center space-x-4 justify-between sm:justify-end shrink-0 pt-2 sm:pt-0">
                              <div className="text-left sm:text-right">
                                <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">A Pagar</span>
                                <span className="text-base font-extrabold text-slate-900">{formatCurrency(montoMitad)}</span>
                              </div>
                              <button
                                onClick={() => openPaymentModal(item)}
                                className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-soft transition-soft hover-lift cursor-pointer"
                              >
                                Registrar Adelanto <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {isSaldoPendiente && (
                          <div className="p-4 hover:bg-slate-50/50 transition-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1 text-left min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="bg-indigo-50 text-indigo-600 text-[9px] font-extrabold px-2 py-0.5 rounded border border-indigo-100 uppercase">Servicio en Curso</span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-sm mt-1">Saldo Faltante (50%)</h4>
                              <p className="text-[10px] text-slate-400">Se cancela al concluir la visita técnica</p>
                            </div>
                            <div className="flex items-center space-x-4 justify-between sm:justify-end shrink-0 pt-2 sm:pt-0">
                              <div className="text-left sm:text-right">
                                <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">A Pagar</span>
                                <span className="text-base font-extrabold text-slate-900">{formatCurrency(montoMitad)}</span>
                              </div>
                              <div className="px-4 py-2 bg-slate-50 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1.5" /> Pago Presencial
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Historial de Pagos */}
            <div className="mt-8 space-y-4">
              <h3 className="font-display font-bold text-sm text-slate-800 flex items-center">
                <History className="w-4.5 h-4.5 text-indigo-500 mr-2" /> Historial de Pagos
              </h3>
              
              {loading ? (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-10 text-center shadow-soft">
                  <div className="inline-block w-6 h-6 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-slate-400 text-xs mt-3">Cargando historial...</p>
                </div>
              ) : Object.keys(groupedPayments).length === 0 ? (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-8 text-center shadow-soft text-xs text-slate-400">
                  No se encontraron pagos registrados en su historial.
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedPayments).map(([sId, pagos]) => {
                    const servicio = pagos[0].solicitud?.tipo_servicio || 'Servicio Técnico';
                    
                    return (
                      <div key={sId} className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-soft-sm text-xs">
                        <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
                           <div>
                             <span className="font-bold text-slate-800 text-sm block">{servicio}</span>
                             <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Ref: {sId}</span>
                           </div>
                           <div className="text-right">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pagos</span>
                             <span className="text-xs font-black text-indigo-600 block mt-0.5">{pagos.length}</span>
                           </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {pagos.map((pago) => (
                             <div key={pago.id_pago || pago.id || Math.random()} className="p-4 hover:bg-slate-50/50 transition-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1 text-left min-w-0 flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono font-bold text-[11px] text-slate-500 uppercase">{pago.concepto || `PAGO-${(pago.id_pago || pago.id || '').toString().padStart(4, '0')}`}</span>
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase ${
                                    pago.estado === 'VERIFICADO' || pago.estado === 'Aprobado' || pago.estado === 'COMPLETADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    pago.estado === 'RECHAZADO' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    'bg-amber-50 text-amber-600 border-amber-100'
                                  }`}>
                                    {pago.estado || 'Pendiente'}
                                  </span>
                                </div>
                                <div className="flex items-center text-[10px] text-slate-400 space-x-3.5 pt-1">
                                  <span>Fecha: {new Date(pago.fecha_pago || pago.created_at || new Date()).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  <span>Op: {pago.nro_operacion || pago.numero_operacion || 'N/A'}</span>
                                </div>
                              </div>
                              <div className="text-left sm:text-right shrink-0">
                                <span className="text-base font-extrabold text-slate-900">{formatCurrency(pago.monto_pagado || pago.monto || 0)}</span>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{pago.metodo_pago || 'TRANSFERENCIA'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-soft space-y-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-sm text-slate-800">Cuentas Recaudadoras</h4>
              <p className="text-xs text-slate-400 leading-normal">
                SIGESTO solo recibe transferencias directas en sus cuentas corrientes empresariales mostradas al registrar un pago. Nunca deposite a cuentas personales de técnicos.
              </p>
            </div>
          </div>
        </div>
      )}

      {showGateway && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border-2 border-slate-200/80 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-soft space-y-6 relative max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-left">
                <h3 className="font-display font-black text-base text-slate-900">Registrar Transferencia</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Orden: {selectedRequest.id}</p>
              </div>
              <button 
                onClick={() => setShowGateway(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-soft cursor-pointer border border-slate-200/60"
              >
                Cerrar
              </button>
            </div>

            {paymentSuccess ? (
              <div className="py-8 text-center space-y-5">
                <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-soft animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-display font-bold text-lg text-slate-800">¡Adelanto Registrado!</h4>
                  <p className="text-xs text-slate-500 leading-relaxed px-4">
                    Su transferencia está siendo verificada por el área de contabilidad. Una vez aprobada, el técnico procederá con la atención programada.
                  </p>
                </div>
                <button
                  onClick={() => setShowGateway(false)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-soft transition-soft hover-lift cursor-pointer w-full border border-indigo-700"
                >
                  Regresar a Facturación
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdvanceSubmit} className="space-y-5 text-left">
                {advanceError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-2.5 text-xs text-rose-600">
                    <span className="font-semibold">{advanceError}</span>
                  </div>
                )}
                
                {bankAccount && (
                  <div className="p-5 bg-white border-2 border-indigo-150 rounded-2xl space-y-3 text-xs shadow-soft-sm">
                    <span className="font-extrabold text-indigo-700 block mb-2 uppercase tracking-widest text-[9px]">Cuentas Corrientes SIGESTO</span>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400 font-semibold">Banco:</span>
                      <span className="font-bold text-slate-800">{bankAccount.banco || 'BCP'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400 font-semibold">Número de Cuenta:</span>
                      <span className="font-mono font-bold text-slate-800">{bankAccount.numero_cuenta || '193-0000000-0-00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">CCI:</span>
                      <span className="font-mono font-bold text-slate-800">{bankAccount.cci || '00219300000000000012'}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Método de Pago / Banco</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="w-4 h-4 text-slate-400" />
                      </div>
                      <select
                        required
                        value={metodoPago}
                        onChange={(e) => setMetodoPago(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-soft appearance-none cursor-pointer"
                      >
                        <option value="">Seleccione el método...</option>
                        <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">N° de Operación (Opcional si sube archivo)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <History className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={numeroOperacion}
                        onChange={(e) => setNumeroOperacion(e.target.value)}
                        placeholder="Ej. 12345678"
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-soft"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monto a Pagar (Mín. 30% - Máx. 100%)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-bold text-xs pl-0.5">S/</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        placeholder="0.00"
                        className={`w-full pl-9 pr-4 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-soft ${
                          advanceError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Subida de Comprobante Cloudinary */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Archivo de Comprobante (Cloudinary)</label>
                    <div className="relative border border-dashed border-slate-300 rounded-xl p-2.5 bg-slate-50">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setComprobanteFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-600 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 cursor-pointer"
                      />
                      {comprobanteFile && (
                        <p className="text-[11px] text-emerald-600 font-semibold mt-1">✓ {comprobanteFile.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-soft transition-soft hover-lift cursor-pointer disabled:opacity-75 border border-indigo-700 mt-2"
                >
                  {processing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Registrando Operación...
                    </span>
                  ) : (
                    <>
                      <span>Confirmar Adelanto</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentView;
