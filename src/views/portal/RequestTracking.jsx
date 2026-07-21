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
  ArrowRight,
  Trophy,
  Sparkles
} from 'lucide-react';

const OPERATIONAL_STAGES = [
  { id: 'PENDIENTE', label: 'Pendiente', desc: 'Revisión en oficina' },
  { id: 'ASIGNADA', label: 'Asignada', desc: 'Técnico seleccionado' },
  { id: 'COTIZADA', label: 'Cotizada', desc: 'Presupuesto listo' },
  { id: 'EN_PROCESO', label: 'En Proceso', desc: 'Reparación activa' },
  { id: 'FINALIZADA', label: 'Finalizada', desc: 'Servicio concluido' }
];

const getOperationalStageIndex = (rawStatus, requestObj = null) => {
  const s = (rawStatus || requestObj?.statusRaw || requestObj?.estado_operativo || requestObj?.estado || requestObj?.status || '').toString().toUpperCase();
  if (['CANCELADA', 'CANCELADO', 'ANULADA', 'RECHAZADA'].includes(s) || s.includes('CANCELAD') || s.includes('RECHAZAD') || s.includes('ANULAD')) return -1;
  if (['FINALIZADA', 'FINALIZADO', 'COMPLETADA', 'TERMINADA', 'PAGADA', 'PAGADO'].includes(s) || s.includes('FINALIZAD') || s.includes('TERMINAD') || s.includes('COMPLETAD')) return 4;
  if (['EN_PROCESO', 'EN CURSO', 'PROCESO', 'EN_EJECUCION'].includes(s) || s.includes('PROCESO') || s.includes('CURSO') || s.includes('EJECUCION')) return 3;
  if (['COTIZADA', 'REVISION_PAGO', 'REVICION_PAGO', 'EN_REVISION', 'REVISION', 'PENDIENTE_PAGO', 'APROBADA', 'APROBADO'].includes(s) || s.includes('COTIZAD') || s.includes('REVISION') || s.includes('REVICION') || s.includes('APROBAD')) return 2;

  let hasPaymentsOrReview = requestObj?.hasInReviewPayment === true ||
    (Array.isArray(requestObj?.payments) && requestObj.payments.length > 0) ||
    parseFloat(requestObj?.total_pagado || requestObj?.monto_pagado || requestObj?.totalPagado || 0) > 0.01 ||
    ['REVISION_PAGO', 'REVICION_PAGO', 'EN_REVISION', 'REVISION', 'PENDIENTE_VALIDACION', 'VERIFICANDO'].includes((requestObj?.estado_pago || requestObj?.estadoPago || requestObj?.cotizacion?.estado_pago || '').toString().toUpperCase()) ||
    (requestObj?.quotation && (parseFloat(requestObj.quotation.total || requestObj.quotation.monto_total || 0) > 0 || (requestObj.quotation.status && requestObj.quotation.status !== 'BORRADOR')));

  if (!hasPaymentsOrReview && requestObj && (requestObj.id || requestObj.idNumeric)) {
    try {
      const localPending = JSON.parse(localStorage.getItem(`sigesto_pending_payments_${requestObj.id}`) || localStorage.getItem(`sigesto_pending_payments_${requestObj.idNumeric}`) || '[]');
      if (Array.isArray(localPending) && localPending.length > 0) {
        hasPaymentsOrReview = true;
      }
    } catch (e) {}
  }

  if (hasPaymentsOrReview) return 2; // COTIZADA como mínimo porque ya existe cotización/abono

  if (['ASIGNADA', 'ASIGNADO'].includes(s) || s.includes('ASIGNAD')) return 1;
  return 0; // PENDIENTE
};

const getVisualOperationalStageIndex = (requestObj, rawIndex, paymentsList = []) => {
  if (!requestObj) return rawIndex;
  let maxIndex = rawIndex;

  const timeline = Array.isArray(requestObj.timeline) ? requestObj.timeline : (Array.isArray(requestObj.historial) ? requestObj.historial : []);
  timeline.forEach(item => {
    const s = (item.estado || item.status || item.titulo || item.title || item.descripcion || '').toString().toUpperCase();
    if (['FINALIZADA', 'FINALIZADO', 'COMPLETADA', 'TERMINADA', 'PAGADA', 'PAGADO'].some(k => s.includes(k))) {
      if (maxIndex < 4) maxIndex = 4;
    } else if (['EN_PROCESO', 'EN CURSO', 'PROCESO', 'EN_EJECUCION'].some(k => s.includes(k))) {
      if (maxIndex < 3) maxIndex = 3;
    } else if (['COTIZADA', 'REVISION_PAGO', 'REVICION_PAGO', 'EN_REVISION', 'REVISION', 'PENDIENTE_PAGO', 'APROBADA', 'APROBADO'].some(k => s.includes(k))) {
      if (maxIndex < 2) maxIndex = 2;
    } else if (['ASIGNADA', 'ASIGNADO'].some(k => s.includes(k))) {
      if (maxIndex < 1) maxIndex = 1;
    }
  });

  const allPays = Array.isArray(paymentsList) && paymentsList.length > 0 ? paymentsList : (Array.isArray(requestObj.payments) ? requestObj.payments : (Array.isArray(requestObj.pagos) ? requestObj.pagos : []));
  const hasVerifiedPayment = allPays.some(p => ['VERIFICADO', 'APROBADO', 'COMPLETADO'].includes((p.estado || '').toString().toUpperCase()));
  if (hasVerifiedPayment && maxIndex < 3) {
    maxIndex = 3;
  }

  const reqId = requestObj.id || requestObj.idNumeric || requestObj.uuid_solicitud || 'unknown';
  if (reqId && reqId !== 'unknown') {
    const storageKey = `sigesto_visual_max_op_stage_${reqId}`;
    try {
      const storedMax = Number(localStorage.getItem(storageKey) || 0);
      if (!isNaN(storedMax) && storedMax > maxIndex && storedMax <= 4) {
        maxIndex = storedMax;
      } else if (maxIndex > storedMax) {
        localStorage.setItem(storageKey, String(maxIndex));
      }
    } catch (e) {}
  }

  return maxIndex;
};

const getOperationalBadge = (request) => {
  if (!request) return null;
  const sRaw = (request?.statusRaw || request?.estado_operativo || request?.estado || request?.status || '').toString().toUpperCase();
  const opIdx = getVisualOperationalStageIndex(request, getOperationalStageIndex(sRaw, request));

  if (opIdx === -1 || ['CANCELADA', 'CANCELADO', 'ANULADA', 'RECHAZADA'].includes(sRaw)) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 uppercase">
        Cancelado
      </span>
    );
  }
  if (opIdx === 4 || ['FINALIZADA', 'FINALIZADO', 'COMPLETADA', 'TERMINADA', 'PAGADA', 'PAGADO'].includes(sRaw)) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
        Finalizado
      </span>
    );
  }
  if (opIdx === 3 || ['EN_PROCESO', 'EN CURSO', 'PROCESO', 'EN_EJECUCION'].includes(sRaw)) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
        En Proceso
      </span>
    );
  }
  if (opIdx === 2 || ['COTIZADA', 'REVISION_PAGO', 'REVICION_PAGO', 'EN_REVISION', 'REVISION', 'PENDIENTE_PAGO', 'APROBADA', 'APROBADO'].includes(sRaw)) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
        Cotizado
      </span>
    );
  }
  if (opIdx === 1 || ['ASIGNADA', 'ASIGNADO'].includes(sRaw)) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
        Asignado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
      Pendiente
    </span>
  );
};

const getFinancialBadge = (request, propTotalAmount = null, propTotalPaid = null, propPayments = null) => {
  if (!request) return null;
  const estado = (request?.statusRaw || request?.estado_operativo || request?.estado || request?.status || '').toString().toUpperCase();

  const totalAmount = propTotalAmount !== null ? propTotalAmount : parseFloat(request?.quotation?.total || request?.quotation?.monto_total || 0);

  let allPayments = propPayments !== null ? [...propPayments] : (Array.isArray(request?.payments) ? [...request.payments] : []);
  try {
    const localPending = JSON.parse(localStorage.getItem(`sigesto_pending_payments_${request?.id}`) || localStorage.getItem(`sigesto_pending_payments_${request?.idNumeric}`) || '[]');
    if (Array.isArray(localPending) && localPending.length > 0) {
      const existingIds = new Set(allPayments.map(p => String(p.id_pago || p.id)));
      const unverified = localPending.filter(lp => !existingIds.has(String(lp.id_pago || lp.id)));
      allPayments = [...unverified, ...allPayments];
    }
  } catch (e) {}

  const totalPaid = propTotalPaid !== null ? propTotalPaid : Math.max(
    allPayments
      .filter(p => !['RECHAZADO', 'CANCELADO'].includes((p.estado || '').toString().toUpperCase()))
      .reduce((sum, p) => sum + parseFloat(p.monto_pagado || p.monto || 0), 0),
    parseFloat(request?.total_pagado || request?.monto_pagado || request?.totalPagado || 0)
  );

  const hasInReviewPayment = allPayments.some(p => ['EN REVISION', 'EN_REVISION', 'REVISION', 'PENDIENTE_VALIDACION', 'PENDIENTE DE VALIDACION', 'VERIFICANDO'].includes((p.estado || '').toString().toUpperCase()));

  if ((totalAmount > 0 && totalPaid >= totalAmount - 0.01) || estado === 'PAGADA' || (request?.estado_pago || '').toString().toUpperCase() === 'COMPLETADO') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
        Pagado / Liquidado
      </span>
    );
  }

  if (estado === 'REVISION_PAGO' || hasInReviewPayment || (request?.estado_pago || '').toString().toUpperCase() === 'EN_REVISION') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5 animate-pulse"></span>
        Pago en Revisión
      </span>
    );
  }

  if (totalPaid > 0.01 || ['APROBADA', 'EN_PROCESO'].includes(estado) || (request?.estado_pago || '').toString().toUpperCase() === 'ADELANTO') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
        Adelanto Confirmado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
      Por Cotizar / Pendiente de Pago
    </span>
  );
};

// Componente B: Estado Financiero (Desvinculado del Flujo Operativo)
const FinancialStatusCard = ({ request, totalAmount, totalPaid: propTotalPaid, remainingBalance: propRemainingBalance, payments = [] }) => {
  let allPayments = Array.isArray(payments) ? [...payments] : [];
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
  const totalPaid = Math.max(propTotalPaid || 0, totalPaidFromPayments, parseFloat(request?.total_pagado || request?.monto_pagado || request?.totalPagado || 0));
  const remainingBalance = Math.max(0, totalAmount - totalPaid);

  const inReviewList = allPayments.filter(p => 
    ['EN REVISION', 'EN_REVISION', 'REVISION', 'PENDIENTE', 'PENDIENTE_VALIDACION', 'VERIFICANDO', 'PENDIENTE DE VALIDACION', 'REVISION_PAGO', 'REVICION_PAGO'].includes((p.estado || '').toString().toUpperCase())
  );

  if (inReviewList.length === 0 && (['REVISION_PAGO', 'REVICION_PAGO', 'EN_REVISION'].includes((request?.statusRaw || request?.estado_pago || request?.estadoPago || '').toString().toUpperCase()))) {
    const fallbackMonto = totalPaid <= 0.01 && totalAmount > 0 ? totalAmount * 0.30 : remainingBalance > 0 ? remainingBalance : totalAmount;
    inReviewList.push({
      id_pago: 'in-review-server',
      concepto: totalPaid <= 0.01 ? 'Adelanto del Servicio' : 'Liquidación del Saldo',
      monto_pagado: fallbackMonto,
      metodo_pago: 'Comprobante registrado',
      estado: 'EN REVISION'
    });
  }

  const getFinancialStatusInfo = () => {
    const estado = (request?.statusRaw || request?.estado_operativo || request?.estado || request?.status || '').toString().toUpperCase();
    let estadoPago = (request?.estado_pago || request?.estadoPago || 'PENDIENTE').toString().toUpperCase();

    if ((totalAmount > 0 && totalPaid >= totalAmount - 0.01) || estado === 'PAGADA' || estadoPago === 'COMPLETADO') {
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

    if (totalPaid > 0.01 || ['APROBADA', 'EN_PROCESO'].includes(estado) || estadoPago === 'ADELANTO') {
      return {
        key: 'ADELANTO',
        label: 'Adelanto Confirmado',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
        cardBorder: 'border-amber-200/80',
        iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
        description: 'Adelanto registrado. Saldo pendiente al finalizar la asistencia.'
      };
    }

    if (inReviewList.length > 0 && totalAmount <= 0) {
      return {
        key: 'EN_REVISION',
        label: 'Pago en Revisión',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        dotClass: 'bg-sky-500 animate-pulse',
        cardBorder: 'border-sky-200/80',
        iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
        description: 'Su comprobante de pago ha sido registrado exitosamente y se encuentra en proceso de validación por nuestro equipo de finanzas.'
      };
    }

    return {
      key: 'PENDIENTE',
      label: totalAmount > 0 ? 'Pendiente de Pago' : 'Por Cotizar / Pendiente de Pago',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      dotClass: 'bg-slate-400',
      cardBorder: 'border-slate-200/70',
      iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
      description: 'En espera de confirmación o registro de pago.'
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
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold border ${statusInfo.badgeClass}`}>
              <span className={`w-2 h-2 rounded-full mr-2 shrink-0 ${statusInfo.dotClass}`}></span>
              {statusInfo.label}
            </span>

            {/* Mensaje secundario con detalle del pago exacto en revisión */}
            {inReviewList.map((p, idx) => {
              const montoPago = parseFloat(p.monto_pagado || p.monto || 0);
              const conceptoPago = p.concepto || (totalAmount > 0 && montoPago >= totalAmount * 0.99 ? 'Liquidación Total (100%)' : totalPaid > 0 ? 'Pago de Saldo' : 'Adelanto del Servicio');
              return (
                <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 shadow-sm animate-pulse">
                  <Clock className="w-3.5 h-3.5 mr-1.5 text-sky-600 shrink-0" />
                  En Revisión ({conceptoPago}): S/ {montoPago.toFixed(2)}
                </span>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
            {inReviewList.length > 0 && statusInfo.key !== 'PAGADO'
              ? `Su comprobante por S/ ${inReviewList.reduce((acc, p) => acc + parseFloat(p.monto_pagado || p.monto || 0), 0).toFixed(2)} (${inReviewList.map(p => p.concepto || (parseFloat(p.monto_pagado || p.monto || 0) >= totalAmount * 0.99 ? 'Liquidación Total' : totalPaid > 0 ? 'Pago de Saldo' : 'Adelanto')).join(', ')}) se encuentra actualmente en verificación por administración.`
              : statusInfo.description}
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
                      : statusInfo.key === 'EN_REVISION'
                      ? 'bg-sky-500 animate-pulse'
                      : statusInfo.key === 'ADELANTO'
                      ? 'bg-amber-500'
                      : 'bg-slate-300'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {totalPaid >= totalAmount - 0.01 && totalAmount > 0 ? (
                /* ESCENARIO A: Pago Total (100%) */
                <div className="p-3 rounded-xl border border-slate-200/60 bg-slate-50 flex justify-between items-center text-xs shadow-soft-sm">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Pago Total (100%)</p>
                    <p className="font-black text-slate-800 mt-0.5">S/ {totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    {statusInfo.key === 'EN_REVISION' ? (
                      <span className="bg-sky-50 text-sky-700 text-[9px] font-extrabold px-2 py-0.5 rounded border border-sky-200 uppercase flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> En Revisión
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 text-[9px] font-extrabold px-2 py-0.5 rounded border border-emerald-100 uppercase flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Abonado
                      </span>
                    )}
                  </div>
                </div>
              ) : totalPaid > 0.01 ? (
                /* ESCENARIO B: Adelanto realizado (parcial) y Faltante */
                <>
                  <div className="p-3 rounded-xl border border-slate-200/60 bg-slate-50 flex justify-between items-center text-xs shadow-soft-sm">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Adelanto Realizado</p>
                      <p className="font-black text-slate-800 mt-0.5">S/ {totalPaid.toFixed(2)}</p>
                    </div>
                    <div>
                      {statusInfo.key === 'EN_REVISION' ? (
                        <span className="bg-sky-50 text-sky-700 text-[9px] font-extrabold px-2 py-0.5 rounded border border-sky-200 uppercase flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> En Revisión
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-600 text-[9px] font-extrabold px-2 py-0.5 rounded border border-emerald-100 uppercase flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Abonado
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200/60 bg-slate-50 flex justify-between items-center text-xs shadow-soft-sm">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Saldo Restante (Faltante)</p>
                      <p className="font-black text-slate-800 mt-0.5">S/ {remainingBalance.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="bg-rose-50 text-rose-600 text-[9px] font-extrabold px-2 py-0.5 rounded border border-rose-100 uppercase flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Faltante
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                /* ESCENARIO C: Cero pagos (Adelanto Mínimo Sugerido y Saldo Restante) */
                <>
                  <div className="p-3 rounded-xl border border-slate-200/60 bg-slate-50 flex justify-between items-center text-xs shadow-soft-sm">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Adelanto Mínimo Sugerido (30%)</p>
                      <p className="font-black text-slate-800 mt-0.5">S/ {(totalAmount * 0.30).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="bg-amber-50 text-amber-600 text-[9px] font-extrabold px-2 py-0.5 rounded border border-amber-100 uppercase flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> Pendiente
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200/60 bg-slate-50 flex justify-between items-center text-xs shadow-soft-sm">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Saldo Restante (70%)</p>
                      <p className="font-black text-slate-800 mt-0.5">S/ {(totalAmount * 0.70).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="bg-rose-50 text-rose-600 text-[9px] font-extrabold px-2 py-0.5 rounded border border-rose-100 uppercase flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Faltante
                      </span>
                    </div>
                  </div>
                </>
              )}
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
                    const isVerified = ['VERIFICADO', 'APROBADO', 'COMPLETADO'].includes((pago.estado || '').toString().toUpperCase());
                    const isRejected = ['RECHAZADO', 'CANCELADO'].includes((pago.estado || '').toString().toUpperCase());
                    const isPending = !isVerified && !isRejected;
                    return (
                      <div key={pago.id_pago || pago.id || Math.random()} className="flex items-center justify-between p-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded-lg ${
                            isVerified ? 'bg-emerald-100 text-emerald-600' :
                            isRejected ? 'bg-rose-100 text-rose-600' :
                            'bg-sky-100 text-sky-600'
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
                          'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {isPending ? 'En Revisión' : pago.estado || 'Pendiente'}
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
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
            currentOperationalIndex === OPERATIONAL_STAGES.length - 1
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
          }`}>
            {currentOperationalIndex === OPERATIONAL_STAGES.length - 1 && (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600 inline" />
            )}
            Etapa {currentOperationalIndex + 1} de {OPERATIONAL_STAGES.length}: {OPERATIONAL_STAGES[currentOperationalIndex]?.label || 'Pendiente'}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6 relative my-auto">
        {OPERATIONAL_STAGES.map((stage, idx) => {
          const isFinalStage = currentOperationalIndex === OPERATIONAL_STAGES.length - 1;
          const isCompleted = idx < currentOperationalIndex || (isFinalStage && idx === OPERATIONAL_STAGES.length - 1);
          const isActive = idx === currentOperationalIndex && !isFinalStage;

          return (
            <div key={idx} className="flex md:flex-col items-center flex-1 w-full relative">
              {idx < OPERATIONAL_STAGES.length - 1 && (
                <div className="hidden md:block absolute left-[50%] top-4 w-[100%] h-0.5 bg-slate-100">
                  <div
                    className={`${isCompleted || idx < currentOperationalIndex ? 'bg-emerald-500' : 'bg-indigo-500'} h-full transition-all duration-500`}
                    style={{ width: isCompleted || idx < currentOperationalIndex ? '100%' : isActive ? '50%' : '0%' }}
                  ></div>
                </div>
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-soft ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-soft ring-4 ring-indigo-500/20'
                    : isCompleted
                    ? 'bg-emerald-500 text-white shadow-soft ring-4 ring-emerald-500/20'
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

// Componente de Pica Pica (Confetti) al estilo Google (campeonatos / celebración)
const GooglePicaPica = ({ trigger }) => {
  useEffect(() => {
    if (!trigger) return;

    // Crear canvas flotante sobre toda la ventana
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Colores festivos estilo Google (Azul, Rojo, Amarillo, Verde, Esmeralda, Dorado, Morado, Rosa)
    const colors = [
      '#4285F4', '#EA4335', '#FBBC05', '#34A853', 
      '#10B981', '#F59E0B', '#6366F1', '#EC4899', 
      '#8B5CF6', '#06B6D4', '#EAB308'
    ];

    const particles = [];
    const particleCount = 140;

    // Generar partículas desde ambos cañones laterales (como en celebraciones de Google) y lluvia superior
    for (let i = 0; i < particleCount; i++) {
      const isLeftCannon = i % 3 === 0;
      const isRightCannon = i % 3 === 1;
      
      let x, y, vx, vy;
      if (isLeftCannon) {
        x = width * 0.08;
        y = height * 0.92;
        vx = Math.random() * 9 + 4;
        vy = -(Math.random() * 15 + 12);
      } else if (isRightCannon) {
        x = width * 0.92;
        y = height * 0.92;
        vx = -(Math.random() * 9 + 4);
        vy = -(Math.random() * 15 + 12);
      } else {
        x = Math.random() * width;
        y = -20 - Math.random() * 100;
        vx = (Math.random() - 0.5) * 4;
        vy = Math.random() * 4 + 2;
      }

      particles.push({
        x,
        y,
        vx,
        vy,
        size: Math.random() * 6 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.35 ? 'rect' : (Math.random() > 0.5 ? 'ribbon' : 'circle'),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.1 + 0.05,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 80 + 160
      });
    }

    let animationFrameId;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      let activeParticles = false;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;

        if (p.life > p.maxLife) {
          p.opacity -= 0.02;
        }

        if (p.opacity > 0) {
          activeParticles = true;
          p.vy += 0.28;
          p.vx *= 0.985;
          p.vy *= 0.99;

          p.x += p.vx + Math.sin(p.wobble) * 1.2;
          p.y += p.vy;
          p.rotation += p.rotationSpeed;
          p.wobble += p.wobbleSpeed;

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          ctx.fillStyle = p.color;
          if (p.shape === 'rect') {
            ctx.scale(Math.cos(p.wobble), 1);
            ctx.fillRect(-p.size, -p.size * 0.6, p.size * 2, p.size * 1.2);
          } else if (p.shape === 'ribbon') {
            ctx.scale(1, Math.sin(p.wobble));
            ctx.fillRect(-p.size * 0.5, -p.size * 1.4, p.size, p.size * 2.8);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      if (activeParticles) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        if (canvas && canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      canvas.width = newWidth * dpr;
      canvas.height = newHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, [trigger]);

  return null;
};

const RequestTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentModal, setPaymentModal] = useState(null);
  const [alertModal, setAlertModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confettiTrigger, setConfettiTrigger] = useState(1);
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
  const fileInputRef = React.useRef(null);

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

      if (getOperationalStageIndex(data.statusRaw, data) >= 2 || ['COTIZADA', 'REVISION_PAGO', 'REVICION_PAGO', 'EN_REVISION', 'REVISION', 'APROBADA', 'APROBADO', 'EN_PROCESO'].includes((data.statusRaw || '').toString().toUpperCase())) {
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
        fetchedPayments = Array.isArray(payData) ? payData : (payData?.data || payData?.pagos || payData?.list || []);
      } catch (payErr) {
        console.warn("No se pudieron cargar los pagos, aplicando inferencia si es posible", payErr);
      }

      // Recuperar pagos en revisión de localStorage para reflejar al instante el pago tras registrarlo
      try {
        const localPending = JSON.parse(localStorage.getItem(`sigesto_pending_payments_${id}`) || '[]');
        if (Array.isArray(localPending) && localPending.length > 0) {
          const serverIds = new Set(fetchedPayments.map(p => String(p.id_pago || p.id)));
          const unverifiedLocal = localPending.filter(lp => !serverIds.has(String(lp.id_pago || lp.id)));
          fetchedPayments = [...unverifiedLocal, ...fetchedPayments];
        }
      } catch (e) {
        console.warn("Error leyendo pagos locales en revisión", e);
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

  const hasInReviewPayment = payments.some(p => 
    ['EN REVISION', 'EN_REVISION', 'REVISION', 'PENDIENTE_VALIDACION', 'PENDIENTE DE VALIDACION', 'VERIFICANDO'].includes((p.estado || '').toString().toUpperCase())
  ) || ['REVISION_PAGO', 'REVICION_PAGO', 'EN_REVISION'].includes((request?.statusRaw || request?.estado_operativo || request?.estado_pago || request?.estadoPago || '').toString().toUpperCase());

  // Registrar Pago (30% mínimo hasta 100% Liquidación, con comprobante opcional/Cloudinary)
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (hasInReviewPayment) {
      setAlertModal({ message: 'No puede registrar un nuevo abono o pago mientras exista un comprobante en proceso de verificación por parte de administración. Por favor, espere a que sea validado para continuar.' });
      return;
    }
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
      setAlertModal({ message: 'Por favor, ingrese un monto válido.' });
      return;
    }
    const totalAmount = request?.quotation?.total || 0;
    const minAdvance = totalAmount * 0.30;
    if (totalPaid <= 0.01 && totalAmount > 0 && Number(paymentAmount) < minAdvance - 0.01) {
      setAlertModal({ message: `El primer pago (adelanto) debe ser como mínimo el 30% del total (S/ ${minAdvance.toFixed(2)}). Puede abonar desde el 30% hasta el 100% para liquidación total.` });
      return;
    }
    if (totalPaid <= 0.01 && totalAmount > 0 && Number(paymentAmount) > totalAmount + 0.01) {
      setAlertModal({ message: `El monto a abonar no puede superar el 100% del total (S/ ${totalAmount.toFixed(2)}).` });
      return;
    }
    if (totalPaid > 0.01 && Math.abs(Number(paymentAmount) - remainingBalance) > 0.05) {
      setAlertModal({ message: `Solo se permite el pago exacto del saldo restante completo (S/ ${remainingBalance.toFixed(2)}). No se permiten abonos fraccionados después del primer pago.` });
      return;
    }
    if (!paymentOperation || !paymentOperation.trim()) {
      setAlertModal({ message: 'El número de operación bancaria es obligatorio.' });
      return;
    }
    if (!paymentFile) {
      setAlertModal({ message: 'Debe adjuntar obligatoriamente el comprobante de pago (imagen o PDF).' });
      return;
    }

    setSubmittingPayment(true);
    try {
      const result = await api.finances.registerAdvance(id, {
        monto_pagado: Number(paymentAmount),
        metodo_pago: paymentMethod,
        nro_operacion: paymentOperation.trim(),
        comprobanteFile: paymentFile
      });

      const isTotal = Number(paymentAmount) >= remainingBalance - 0.01 || Number(paymentAmount) + totalPaid >= totalAmount - 0.01 || result?.es_liquidacion_total;

      // Guardar el pago localmente para que FinancialStatusCard lo refleje EN REVISIÓN al instante
      try {
        const pendingPaymentObj = {
          id_pago: result?.data?.id_pago || result?.pago?.id_pago || `rev-${Date.now()}`,
          concepto: isTotal ? 'Liquidación Total (100%)' : 'Adelanto / Abono de Cotización',
          monto_pagado: Number(paymentAmount),
          metodo_pago: paymentMethod,
          nro_operacion: paymentOperation.trim(),
          estado: 'EN REVISION',
          fecha_pago: new Date().toISOString()
        };
        const existingLocal = JSON.parse(localStorage.getItem(`sigesto_pending_payments_${id}`) || '[]');
        localStorage.setItem(`sigesto_pending_payments_${id}`, JSON.stringify([pendingPaymentObj, ...existingLocal]));
      } catch (e) {
        console.warn("No se pudo guardar pago en revisión localmente", e);
      }

      setPaymentModal({
        isTotal,
        monto: Number(paymentAmount),
        metodo: paymentMethod,
        nroOperacion: paymentOperation.trim()
      });

      await loadRequest();
      
      setPaymentAmount('');
      setPaymentOperation('');
      setPaymentFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setAlertModal({ message: err.message || 'Error al registrar el pago.' });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const isCancelled =
    request &&
    ['CANCELADA', 'CANCELADO', 'ANULADA', 'RECHAZADA'].includes(
      (request.statusRaw || request.status || '').toString().toUpperCase()
    );

  const totalAmount = request?.quotation ? parseFloat(request.quotation.total || request.quotation.monto_total || 0) : 0;
  const totalPaid = payments
    .filter(p => !['RECHAZADO', 'CANCELADO'].includes((p.estado || '').toString().toUpperCase()))
    .reduce((sum, p) => sum + parseFloat(p.monto_pagado || p.monto || 0), 0);
  const remainingBalance = Math.max(0, totalAmount - totalPaid);

  const epMain = (request?.estado_pago || request?.estadoPago || request?.quotation?.estado_pago || '').toString().toUpperCase();
  const qsMain = (request?.quotation?.status || request?.quotation?.estado || '').toString().toUpperCase();

  const reqWithPayments = request ? { ...request, payments, hasInReviewPayment } : null;
  const currentOperationalIndex = reqWithPayments ? getOperationalStageIndex(reqWithPayments.statusRaw || reqWithPayments.status, reqWithPayments) : 0;

  useEffect(() => {
    if (totalPaid > 0.01 && remainingBalance > 0) {
      setPaymentAmount(remainingBalance.toFixed(2));
    } else if (totalPaid <= 0.01 && totalAmount > 0 && !paymentAmount) {
      setPaymentAmount((totalAmount * 0.30).toFixed(2));
    }
  }, [totalPaid, remainingBalance, totalAmount]);

  const estadoPagoMain = (request?.estado_pago || request?.estadoPago || request?.quotation?.estado_pago || '').toString().toUpperCase();
  const tipoPagoMain = (request?.tipo_pago || request?.tipoPago || request?.quotation?.tipo_pago || '').toString().toUpperCase();
  const rawStatusMain = (request?.statusRaw || request?.status || '').toString().toUpperCase();
  const quotationStatusMain = (request?.quotation?.status || request?.quotation?.estado || '').toString().toUpperCase();

  const isFullyPaid =
    (estadoPagoMain === 'COMPLETADO' && (tipoPagoMain === 'FINAL' || tipoPagoMain === 'TOTAL')) ||
    estadoPagoMain === 'PAGADO' ||
    estadoPagoMain === 'LIQUIDADO' ||
    quotationStatusMain === 'PAGADO' ||
    quotationStatusMain === 'LIQUIDADO' ||
    quotationStatusMain === 'PAGADA' ||
    rawStatusMain === 'FINALIZADA' ||
    rawStatusMain === 'FINALIZADO' ||
    rawStatusMain === 'COMPLETADA' ||
    rawStatusMain === 'TERMINADA' ||
    (totalAmount > 0 && remainingBalance <= 0.01 && totalPaid >= totalAmount - 0.01);

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
    <div className="space-y-6 text-left font-sans animate-fade-in relative">
      {paymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-7 shadow-2xl space-y-6 text-center relative overflow-hidden animate-scale-in">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center justify-center mx-auto shadow-soft-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-sky-50 text-sky-700 border border-sky-200">
                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-sky-500 animate-pulse"></span>
                Pago en Revisión
              </span>
              <h3 className="font-display font-black text-slate-800 text-lg md:text-xl">
                {paymentModal.isTotal ? '¡Liquidación Total (100%)!' : '¡Adelanto Registrado con Éxito!'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed px-2">
                {paymentModal.isTotal
                  ? 'Has completado el registro del pago por el 100% de la cotización. Tu comprobante se encuentra en proceso de validación y revisión por nuestro equipo de finanzas.'
                  : 'Tu pago de adelanto ha sido registrado correctamente. Nuestro equipo de finanzas verificará el comprobante para confirmar y validar la transacción.'}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monto Registrado</span>
                <span className="font-extrabold text-emerald-600 text-sm">S/ {paymentModal.monto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Método</span>
                <span className="font-bold text-slate-700">{paymentModal.metodo}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Estado de Validación</span>
                <span className="font-bold text-sky-600 flex items-center gap-1">
                  <Clock className="w-3 h-3 animate-spin" /> En Revisión
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPaymentModal(null)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-soft transition-soft cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Entendido y Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {alertModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-center animate-scale-in">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-display font-extrabold text-slate-800 text-sm">Atención</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{alertModal.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setAlertModal(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-soft cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
      
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
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 font-medium">Tipo: {request.type}</span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              {getOperationalBadge(reqWithPayments || request)}
              {getFinancialBadge(request, totalAmount, totalPaid, payments)}
            </div>
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

      {/* 1. SEPARACIÓN VISUAL: BANNER SI ESTÁ ANULADO */}
      {isCancelled && (
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 flex items-start space-x-3 text-rose-800 animate-slide-up">
          <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Esta solicitud ha sido Anulada</h4>
            <p className="text-xs text-rose-600 mt-1 leading-normal">
              La solicitud fue cancelada por el cliente y no generará cargos. Los registros quedan archivados en su historial operativo para fines de auditoría.
            </p>
          </div>
        </div>
      )}

      {/* BANNER DE AGRADECIMIENTO Y FINALIZACIÓN TOTAL */}
      {getVisualOperationalStageIndex(request, currentOperationalIndex, payments) === 4 && isFullyPaid && !isCancelled && (
        <>
          <GooglePicaPica trigger={confettiTrigger} />
          <div className="relative overflow-hidden rounded-2xl bg-white p-4 md:p-5 mb-8 border border-slate-200/80 shadow-soft hover:shadow-md transition-all duration-300 animate-slide-up group">
            {/* Acento superior multicolor de celebración y sutiles destellos de fondo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-indigo-500"></div>
            <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-emerald-50/60 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
            <div className="absolute -left-12 -top-12 w-40 h-40 bg-amber-50/50 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
              {/* Contenido izquierdo + centro sintetizado */}
              <div className="flex items-center space-x-3.5 md:space-x-4 text-center sm:text-left min-w-0 flex-1">
                <div
                  className="p-3 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-2xl text-white shadow-md shadow-amber-500/20 shrink-0 flex items-center justify-center relative"
                >
                  <Trophy className="w-6 h-6 text-white drop-shadow-sm" />
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white"></span>
                  </span>
                  <Sparkles className="absolute -top-2 -left-1.5 w-4 h-4 text-amber-300 animate-bounce pointer-events-none" />
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="font-display font-black text-base md:text-lg tracking-tight text-slate-800">
                      ¡Gracias por su preferencia y confianza!
                    </h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                      100% Concluido & Liquidado
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-3xl">
                    Hemos finalizado con éxito el servicio técnico y la liquidación de pago. Ha sido un verdadero placer atenderle, ¡esperamos volver a servirle pronto!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MASTER 12-COLUMN DASHBOARD LAYOUT: 8 Columnas Principal / 4 Columnas Lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start animate-slide-up">
        
        {/* COLUMNA PRINCIPAL (8 Columnas): Flujo Operativo, Descripción, Cotización/Pago, Timeline */}
        <div className="lg:col-span-8 space-y-6 lg:space-y-8">
          {/* 1. Flujo Operativo */}
          {!isCancelled && (
            <OperationalStepper request={request} currentOperationalIndex={getVisualOperationalStageIndex(request, currentOperationalIndex, payments)} />
          )}
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
          {request.quotation && (getVisualOperationalStageIndex(request, currentOperationalIndex, payments) >= 2 || (request.quotation.status !== 'BORRADOR' && totalAmount > 0.01)) && (
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
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      request.quotation.status === 'APROBADA'
                        ? 'bg-emerald-500'
                        : request.quotation.status === 'ENVIADA'
                        ? 'bg-sky-500 animate-pulse'
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


              
              {request.statusRaw === 'COTIZADA' && !isQuotationAccepted && totalPaid <= 0.01 && !isFullyPaid && (
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setIsQuotationAccepted(true);
                      const total = parseFloat(request?.quotation?.total || totalAmount || 0);
                      setPaymentAmount((total * 0.30).toFixed(2));
                    }}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-soft hover-lift cursor-pointer flex items-center justify-center space-x-2 transition-soft border border-emerald-700"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprobar Cotización y Pagar</span>
                  </button>
                  <button
                    onClick={handleRejectQuotation}
                    className="flex-1 py-3.5 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl transition-soft cursor-pointer border border-slate-200 hover:border-rose-200 flex items-center justify-center space-x-2 shadow-soft-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rechazar Presupuesto</span>
                  </button>
                </div>
              )}

              {request.quotation && !isFullyPaid && totalAmount > 0.01 && (
                (request.statusRaw === 'COTIZADA' && isQuotationAccepted) ||
                totalPaid > 0.01 ||
                ['APROBADA', 'REVISION_PAGO', 'REVICION_PAGO', 'EN_REVISION', 'REVISION', 'EN_PROCESO', 'EN CURSO'].includes((request.statusRaw || request.status || '').toString().toUpperCase())
              ) && (
                <div className="pt-5 border-t border-slate-150 animate-slide-up space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                      <h4 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest">
                        Registrar Pago / Abono de Cotización
                      </h4>
                    </div>
                    {totalPaid > 0.01 ? (
                      <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                        Saldo Pendiente: S/ {remainingBalance.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                        Adelanto mín. 30% — Pago Total 100%
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
                    {bankAccount && (
                      <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50/70 via-slate-50/60 to-indigo-50/40 border border-indigo-100/80 rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-soft-sm relative overflow-hidden">
                        <div>
                          <div className="flex items-center justify-between border-b border-indigo-100/60 pb-3 mb-4">
                            <h5 className="font-extrabold text-indigo-950 flex items-center text-xs md:text-sm">
                              <CreditCard className="w-4 h-4 mr-2 text-indigo-600 shrink-0" />
                              Datos de Recaudación
                            </h5>
                            <span className="text-[9px] font-extrabold bg-white text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-150 shadow-2xs">
                              Directa
                            </span>
                          </div>

                          <div className="space-y-3.5 text-xs">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Titular de la Cuenta</span>
                              <span className="font-bold text-slate-800 text-xs mt-0.5 block">{bankAccount.titular}</span>
                            </div>

                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Entidad Financiera</span>
                              <span className="font-bold text-slate-800 text-xs mt-0.5 block">{bankAccount.banco}</span>
                            </div>

                            <div className="pt-2 border-t border-indigo-100/50 space-y-3">
                              <div className="flex items-center justify-between bg-white/90 border border-indigo-100/80 rounded-xl px-3.5 py-2.5 shadow-2xs hover:border-indigo-300 transition-soft">
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Nro. de Cuenta ({bankAccount.tipo_cuenta})</span>
                                  <span className="font-mono font-extrabold text-indigo-950 text-xs mt-0.5 block tracking-wide">{bankAccount.numero_cuenta}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(bankAccount.numero_cuenta, 'cuenta')}
                                  className="px-2.5 py-1.5 bg-indigo-50/80 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-[10px] rounded-lg border border-indigo-200/60 transition-soft cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                                  title="Copiar Nro de Cuenta"
                                >
                                  {copiedField === 'cuenta' ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span className="text-emerald-600">¡Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copiar</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="flex items-center justify-between bg-white/90 border border-indigo-100/80 rounded-xl px-3.5 py-2.5 shadow-2xs hover:border-indigo-300 transition-soft">
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Código Interbancario (CCI)</span>
                                  <span className="font-mono font-extrabold text-indigo-950 text-xs mt-0.5 block tracking-wide">{bankAccount.cci}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(bankAccount.cci, 'cci')}
                                  className="px-2.5 py-1.5 bg-indigo-50/80 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-[10px] rounded-lg border border-indigo-200/60 transition-soft cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                                  title="Copiar CCI"
                                >
                                  {copiedField === 'cci' ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span className="text-emerald-600">¡Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copiar</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="pt-1 flex items-center justify-between">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Moneda</span>
                              <span className="font-extrabold text-slate-800 text-xs">{bankAccount.moneda}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/80 border border-indigo-100 p-3 rounded-xl text-[11px] text-slate-600 font-medium flex items-start gap-2 mt-4 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1"></span>
                          <span className="leading-relaxed">{bankAccount.mensaje || 'Realice su transferencia por el monto deseado y registre el número de comprobante al lado.'}</span>
                        </div>
                      </div>
                    )}

                    <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-soft-sm flex flex-col justify-between">
                      {hasInReviewPayment ? (
                        <div className="flex flex-col items-center justify-center text-center p-8 my-auto space-y-4 animate-fade-in">
                          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100 flex items-center justify-center shadow-soft-sm">
                            <Clock className="w-8 h-8 animate-pulse" />
                          </div>
                          <div className="space-y-2 max-w-md">
                            <h5 className="font-display font-extrabold text-slate-800 text-sm md:text-base">
                              Comprobante en Proceso de Verificación
                            </h5>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Hemos recibido el registro de su abono y se encuentra actualmente en revisión por nuestro departamento de finanzas.
                            </p>
                            <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3.5 text-[11px] font-bold text-sky-900 mt-4 leading-normal shadow-2xs flex items-center gap-2 text-left">
                              <AlertTriangle className="w-5 h-5 text-sky-600 shrink-0" />
                              <span>Por seguridad, no es posible registrar pagos o abonos adicionales hasta que se verifique y apruebe el comprobante anterior.</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitPayment} className="space-y-5">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                1. Seleccionar o Ingresar Monto (S/)
                              </label>
                              <span className="text-[10px] font-bold text-indigo-600">
                                ⚡ Carga Rápida
                              </span>
                            </div>

                            {totalPaid > 0.01 ? (
                              <div className="mb-4 bg-amber-50/90 border border-amber-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 bg-amber-500/15 text-amber-700 rounded-lg shrink-0">
                                    <DollarSign className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <h6 className="text-xs font-black text-amber-950">Liquidación de Saldo Faltante</h6>
                                    <p className="text-[11px] text-amber-700 font-medium">No se admiten abonos en partes. Pago único del 100% restante.</p>
                                  </div>
                                </div>
                                <span className="text-xs font-black text-amber-900 bg-amber-200/70 px-3 py-1.5 rounded-lg border border-amber-300/60 shrink-0">
                                  S/ {remainingBalance.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const total = parseFloat(request?.quotation?.total || totalAmount || 0);
                                    setPaymentAmount((total * 0.30).toFixed(2));
                                  }}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-soft cursor-pointer flex flex-col items-center justify-center ${
                                    Math.abs(parseFloat(paymentAmount || 0) - parseFloat(request?.quotation?.total || totalAmount || 0) * 0.30) < 0.05
                                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-soft-sm'
                                      : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200 hover:border-indigo-200'
                                  }`}
                                >
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">30% (Mínimo)</span>
                                  <span className="text-xs mt-0.5">S/ {(parseFloat(request?.quotation?.total || totalAmount || 0) * 0.30).toFixed(2)}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const total = parseFloat(request?.quotation?.total || totalAmount || 0);
                                    setPaymentAmount((total * 0.50).toFixed(2));
                                  }}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-soft cursor-pointer flex flex-col items-center justify-center ${
                                    Math.abs(parseFloat(paymentAmount || 0) - parseFloat(request?.quotation?.total || totalAmount || 0) * 0.50) < 0.05
                                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-soft-sm'
                                      : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200 hover:border-indigo-200'
                                  }`}
                                >
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">50% (Mitad)</span>
                                  <span className="text-xs mt-0.5">S/ {(parseFloat(request?.quotation?.total || totalAmount || 0) * 0.50).toFixed(2)}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const total = parseFloat(request?.quotation?.total || totalAmount || 0);
                                    setPaymentAmount(total.toFixed(2));
                                  }}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-soft cursor-pointer flex flex-col items-center justify-center ${
                                    Math.abs(parseFloat(paymentAmount || 0) - parseFloat(request?.quotation?.total || totalAmount || 0)) < 0.05
                                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-soft-sm'
                                      : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-200'
                                  }`}
                                >
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">100% (Total)</span>
                                  <span className="text-xs mt-0.5">S/ {parseFloat(request?.quotation?.total || totalAmount || 0).toFixed(2)}</span>
                                </button>
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <div className="relative rounded-xl shadow-soft-sm">
                                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <DollarSign className="w-4 h-4 text-slate-400" />
                                  </div>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min={totalPaid <= 0.01 ? ((request?.quotation ? parseFloat(request.quotation.total || request.quotation.monto_total || 0) : 0) * 0.30).toFixed(2) : remainingBalance.toFixed(2)}
                                    max={remainingBalance.toFixed(2)}
                                    required
                                    readOnly={totalPaid > 0.01}
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-soft read-only:bg-slate-100 read-only:text-slate-500 read-only:cursor-not-allowed"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="relative rounded-xl shadow-soft-sm">
                                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <CreditCard className="w-4 h-4 text-slate-400" />
                                  </div>
                                  <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-soft appearance-none cursor-pointer"
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
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                2. Número de Operación (* Obligatorio)
                              </label>
                              <div className="relative rounded-xl shadow-soft-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                  <Hash className="w-4 h-4 text-slate-400" />
                                </div>
                                <input
                                  type="text"
                                  required
                                  value={paymentOperation}
                                  onChange={(e) => setPaymentOperation(e.target.value)}
                                  className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-soft"
                                  placeholder="Ej: 351-98765432"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                3. Adjuntar Comprobante de Pago (* Obligatorio)
                              </label>
                              <div className="relative rounded-xl border border-dashed border-slate-300 p-3 bg-slate-50/80 hover:bg-slate-100/80 transition-soft">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  required={!paymentFile}
                                  accept="image/*,.pdf"
                                  onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border border-slate-200 file:text-xs file:font-bold file:bg-white file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
                                />
                                {paymentFile && (
                                  <p className="text-[11px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> {paymentFile.name}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-3 pt-2 border-t border-slate-100">
                              {totalPaid <= 0.01 && request.statusRaw === 'COTIZADA' && (
                                <button
                                  type="button"
                                  onClick={() => setIsQuotationAccepted(false)}
                                  disabled={submittingPayment}
                                  className="flex-1 py-3.5 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-soft cursor-pointer border border-slate-200 hover:border-slate-300 disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-2xs"
                                >
                                  <span>Volver</span>
                                </button>
                              )}
                              <button
                                type="submit"
                                disabled={submittingPayment || !paymentAmount || !paymentOperation.trim() || !paymentFile || (totalPaid <= 0.01 && Number(paymentAmount) < (request?.quotation ? parseFloat(request.quotation.total || request.quotation.monto_total || 0) : 0) * 0.30 - 0.01)}
                                className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-soft cursor-pointer disabled:opacity-50 flex justify-center items-center space-x-2 shadow-soft border border-emerald-700 hover-lift"
                              >
                                {submittingPayment ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Registrando...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>{totalPaid > 0.01 ? 'Registrar Abono Restante' : 'Registrar y Notificar Pago'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
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

        {/* COLUMNA LATERAL (4 Columnas): Estado Financiero, Técnico Asignado, Evidencias, Ayuda */}
        <div className="lg:col-span-4 space-y-6 lg:space-y-8">
          {/* 1. Estado Financiero */}
          {!isCancelled && (
            <FinancialStatusCard
              request={request}
              totalAmount={totalAmount}
              totalPaid={totalPaid}
              remainingBalance={remainingBalance}
              payments={payments}
            />
          )}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {evidences.map((ev, idx) => (
                      <div key={ev.id_evidencia || idx} className="rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-soft-sm flex flex-col">
                        <div className="h-32 bg-slate-100 relative">
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
