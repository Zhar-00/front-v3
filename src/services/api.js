// src/services/api.js

const API_BASE_URL = "https://cornflowerblue-wallaby-868308.hostingersite.com/api";

// --- DEBUG LOGGER TEMPORAL ---
const nativeFetch = window.fetch;
const fetch = async (url, options = {}) => {
  const method = options.method || 'GET';
  console.log('--- DEBUG PETICIÓN HTTP ---');
  console.log('URL Final:', url);
  console.log('Método:', method);
  const response = await nativeFetch(url, options);
  console.log('Respuesta:', response.status);
  return response;
};
// -----------------------------

const getStorageItem = (key, defaultValue) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

const setStorageItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getHeaders = (requiresToken = true) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (requiresToken) {
    const token = localStorage.getItem('sigesto_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

const createApiError = (message, status, data, validationErrors = null) => {
  const error = new Error(message);
  error.status = status;
  error.data = data;
  error.validationErrors = validationErrors;
  error.isUnsupported = [404, 405, 501].includes(status);
  error.isTemporaryUnavailable = status >= 500;
  return error;
};

const dispatchToast = (message, type = 'error') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api-toast', { detail: { message, type } }));
  }
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('sigesto_token');
      localStorage.removeItem('sigesto_current_user');
      window.location.href = '/login';
      throw createApiError('Sesión expirada o no autorizada. Por favor, inicie sesión nuevamente.', response.status, data);
    }
    if (response.status === 403) {
      dispatchToast('No tiene permisos para realizar esta acción.', 'error');
      throw createApiError('No tiene permisos para realizar esta acción.', response.status, data);
    }
    if (response.status === 404 || response.status === 405 || response.status === 501) {
      throw createApiError('La funcionalidad solicitada no está implementada o no se encuentra disponible.', response.status, data);
    }
    if (response.status === 422) {
      const errorMessages = data.errors ? Object.values(data.errors).flat().join('\n') : (data.message || 'Error de validación.');
      throw createApiError(errorMessages, response.status, data, data.errors);
    }
    if (response.status === 400 || response.status === 409) {
      const msg = data.error || data.mensaje || data.message || 'Ocurrió un error con su solicitud.';
      dispatchToast(msg, 'warning');
      throw createApiError(msg, response.status, data);
    }
    if (response.status >= 500) {
      dispatchToast('Error interno del servidor. La funcionalidad no está disponible temporalmente.', 'error');
      throw createApiError('Error interno del servidor. La funcionalidad no está disponible temporalmente.', response.status, data);
    }

    const defaultMsg = data.error || data.mensaje || data.message || 'Ocurrió un error en la solicitud al servidor.';
    dispatchToast(defaultMsg, 'error');
    throw createApiError(defaultMsg, response.status, data);
  }

  return data;
};

export const api = {
  auth: {
    login: async (email, password) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ email, password })
      });
      const data = await handleResponse(response);
      const userRole = data.usuario?.rol || data.usuario?.nombre_rol;

      if (userRole !== 'CLIENTE') {
        throw new Error('Acceso denegado. Este portal es exclusivo para clientes.');
      }
      localStorage.setItem('sigesto_token', data.token);
      const mappedUser = await api.auth.getProfile();
      return { user: mappedUser, token: data.token };
    },
    register: async (userData) => {
      const registerResponse = await fetch(`${API_BASE_URL}/auth/registrar`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({
          nombres: userData.nombres,
          apellidos: userData.apellidos,
          email: userData.email,
          password: userData.password,
          password_confirmation: userData.password_confirmation,
          dni_ruc: userData.dni_ruc,
          telefono: userData.phone,
          direccion: userData.address
        })
      });
      await handleResponse(registerResponse);
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ email: userData.email, password: userData.password })
      });
      const loginData = await handleResponse(loginResponse);
      const userRole = loginData.usuario?.rol || loginData.usuario?.nombre_rol;
      if (userRole !== 'CLIENTE') {
        throw new Error('Error de validación post-registro.');
      }
      localStorage.setItem('sigesto_token', loginData.token);
      const mappedUser = await api.auth.getProfile();
      return { user: mappedUser, token: loginData.token };
    },
    recoverPassword: async (email) => {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ email })
      });
      return await handleResponse(response);
    },
    getProfile: async () => {
      const response = await fetch(`${API_BASE_URL}/usuarios/perfil`, {
        method: 'GET',
        headers: getHeaders(true)
      });
      const data = await handleResponse(response);
      const user = data.data || data;
      let fName = user.nombres || '';
      let lName = user.apellidos || '';
      if (!fName && !lName && user.nombre_completo) {
        const parts = user.nombre_completo.trim().split(' ');
        if (parts.length > 2) {
          fName = parts.slice(0, 2).join(' ');
          lName = parts.slice(2).join(' ');
        } else {
          fName = parts[0] || '';
          lName = parts[1] || '';
        }
      }

      const mappedUser = {
        name: user.nombre_completo || `${fName} ${lName}`.trim(),
        firstname: fName,
        lastname: lName,
        email: user.email,
        phone: user.datos_perfil?.telefono || '',
        address: user.datos_perfil?.direccion || '',
        rol: user.rol,
        id_cliente: user.datos_perfil?.id_cliente || user.id_cliente || user.id || 1,
        id: user.id
      };
      setStorageItem('sigesto_current_user', mappedUser);
      return mappedUser;
    },
    updateProfile: async (profileData) => {
      const payload = {
        nombres: profileData.firstname,
        apellidos: profileData.lastname,
        telefono: profileData.phone,
        direccion: profileData.address
      };
      const response = await fetch(`${API_BASE_URL}/usuarios/perfil`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(payload)
      });
      const data = await handleResponse(response);
      const user = data.data || data.usuario || data;
      const mappedUser = {
        name: user.nombre_completo || `${user.nombres || ''} ${user.apellidos || ''}`.trim(),
        firstname: user.nombres || profileData.firstname || '',
        lastname: user.apellidos || profileData.lastname || '',
        email: user.email,
        phone: user.datos_perfil?.telefono || profileData.phone || '',
        address: user.datos_perfil?.direccion || profileData.address || '',
        rol: user.rol
      };
      setStorageItem('sigesto_current_user', mappedUser);
      return mappedUser;
    },
    logout: async () => {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: getHeaders(true)
        });
      } catch (e) {
        console.warn("La sesión expiró o hubo un problema de red al cerrar sesión.");
      } finally {
        localStorage.removeItem('sigesto_token');
        localStorage.removeItem('sigesto_current_user');
      }
      return true;
    }
  },
  requests: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/solicitudes/mis-solicitudes`, {
        method: 'GET',
        headers: getHeaders(true)
      });
      const data = await handleResponse(response);
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (Array.isArray(data.data)) {
        items = data.data;
      } else if (data.data && Array.isArray(data.data.data)) {
        items = data.data.data;
      } else if (data.data && data.data.solicitudes && Array.isArray(data.data.solicitudes)) {
        items = data.data.solicitudes; // Formato V2 detectado
      } else if (data.solicitudes && Array.isArray(data.solicitudes)) {
        items = data.solicitudes;
      } else if (typeof data === 'object') {
        const arrays = Object.values(data).filter(Array.isArray);
        if (arrays.length > 0) items = arrays[0];
      }

      return items.map(s => {
        let mappedStatus = s.estado ? s.estado.charAt(0).toUpperCase() + s.estado.slice(1).toLowerCase() : 'Pendiente';
        if (mappedStatus === 'En_proceso') mappedStatus = 'En ejecución';

        return {
          id: s.uuid_solicitud || s.id_solicitud || s.id,
          status: mappedStatus,
          statusRaw: s.estado,
          type: s.tipo_servicio || s.tipo || 'Avería Eléctrica',
          description: s.descripcion_problema || s.descripcion || s.description || s.detalle || 'Sin descripción registrada',
          createdAt: s.fecha_creacion || s.created_at || new Date().toISOString(),
          location: { address: s.direccion_servicio || s.direccion || s.location?.address || s.direccion_solicitud || 'Dirección no especificada' },
          isEmergency: Boolean(s.es_urgente || s.es_emergencia || s.is_emergency),
          materiales_cliente: s.materiales_cliente || null,
          technician: s.tecnico ? {
            name: s.tecnico.nombre_completo || (s.tecnico.usuario ? `${s.tecnico.usuario.nombres} ${s.tecnico.usuario.apellidos}` : `${s.tecnico.nombres || ''} ${s.tecnico.apellidos || ''}`.trim()) || 'Técnico Asignado',
            phone: s.tecnico.telefono || 'No registrado',
            photo: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&q=80',
            vehicle: 'Unidad de Servicio',
            plate: 'No registrada'
          } : null,
          quotation: s.cotizacion ? {
            id: s.cotizacion.id_cotizacion,
            status: s.cotizacion.estado,
            total: parseFloat(s.cotizacion.total || s.cotizacion.monto_total || 0),
          } : null
        };
      });
    },
    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/solicitudes/${id}`, {
        method: 'GET',
        headers: getHeaders(true)
      });
      const data = await handleResponse(response);
      const s = data.solicitud || (data.data && data.data.solicitud) || data.data || data;

      let mappedStatus = s.estado ? s.estado.charAt(0).toUpperCase() + s.estado.slice(1).toLowerCase() : 'Pendiente';
      if (mappedStatus === 'En_proceso') mappedStatus = 'En ejecución';

      return {
        id: s.uuid_solicitud || s.id_solicitud || s.id,
        status: mappedStatus,
        statusRaw: s.estado,
        type: s.tipo_servicio || s.tipo || 'Avería Eléctrica',
        description: s.descripcion_problema || s.descripcion || s.description || s.detalle || 'Sin descripción registrada',
        location: { address: s.direccion_servicio || s.direccion || s.location?.address || s.direccion_solicitud || 'Dirección no especificada' },
        isEmergency: Boolean(s.es_urgente || s.es_emergencia),
        materiales_cliente: s.materiales_cliente || null,
        timeline: data.timeline || s.timeline || [],
        scheduledDate: s.fecha_programada,
        scheduledTime: s.hora_programada,
        createdAt: s.created_at || s.fecha_creacion,
        technician: s.tecnico ? {
          name: s.tecnico.nombre_completo || (s.tecnico.usuario ? `${s.tecnico.usuario.nombres} ${s.tecnico.usuario.apellidos}` : `${s.tecnico.nombres || ''} ${s.tecnico.apellidos || ''}`.trim()) || 'Técnico Asignado',
          phone: s.tecnico.telefono || s.tecnico.usuario?.telefono || 'No registrado',
          photo: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&q=80',
          eta: 'Aprox. 30 min',
          vehicle: 'Unidad de Servicio',
          plate: 'No registrada'
        } : null,
        quotation: s.cotizacion ? {
          id: s.cotizacion.id_cotizacion,
          status: s.cotizacion.estado,
          subtotal: parseFloat(s.cotizacion.subtotal || 0),
          igv: parseFloat(s.cotizacion.igv || 0),
          total: parseFloat(s.cotizacion.total || s.cotizacion.monto_total || 0),
          items: s.cotizacion.detalles || s.cotizacion.items || []
        } : null
      };
    },
    create: async (requestData) => {
      const currentUser = getStorageItem('sigesto_current_user', {});
      const explicitlyDisabledMap = requestData.includeMapInfo === false || requestData.enviar_mapa === false;

      const rawLat = requestData.latitud !== undefined ? requestData.latitud : (requestData.lat !== undefined ? requestData.lat : requestData.coordinates?.lat);
      const rawLng = requestData.longitud !== undefined ? requestData.longitud : (requestData.lng !== undefined ? requestData.lng : requestData.coordinates?.lng);

      const lat = !explicitlyDisabledMap && rawLat != null && rawLat !== '' ? Number(rawLat) : null;
      const lng = !explicitlyDisabledMap && rawLng != null && rawLng !== '' ? Number(rawLng) : null;

      const payload = {
        id_cliente: requestData.id_cliente || currentUser.id_cliente || currentUser.id || 1, // Fallback dinámico
        descripcion_problema: requestData.descripcion_problema || requestData.description,
        direccion_servicio: requestData.direccion_servicio || requestData.address,
        direccion: requestData.direccion || requestData.direccion_servicio || requestData.address,
        fecha_preferida: requestData.fecha_preferida || requestData.scheduledDate || null,
        hora_preferida: requestData.hora_preferida || requestData.scheduledTime || null,
        notas_disponibilidad: requestData.notas_disponibilidad || requestData.notasDisponibilidad || (requestData.isEmergency ? 'URGENTE - Emergencia Reportada' : 'Preferente'),
        materiales_cliente: requestData.materiales_cliente || null,
        es_urgente: Boolean(requestData.es_urgente ?? requestData.isEmergency),
        enviar_mapa: !explicitlyDisabledMap && lat !== null && lng !== null,
        latitud: lat,
        longitud: lng,
        lat: lat,
        lng: lng,
        latitude: lat,
        longitude: lng,
        foto_base64: requestData.foto_base64 || requestData.photo,
        es_emergencia: Boolean(requestData.es_emergencia ?? requestData.es_urgente ?? requestData.isEmergency),
        tipo_servicio: requestData.tipo_servicio || requestData.type || 'Avería Eléctrica'
      };

      console.log('📍 [DEBUG GEOLOCALIZACIÓN] Payload enviado a POST /api/solicitudes:', {
        latitud: payload.latitud,
        longitud: payload.longitud,
        enviar_mapa: payload.enviar_mapa,
        direccion_servicio: payload.direccion_servicio
      });

      const response = await fetch(`${API_BASE_URL}/solicitudes`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload)
      });

      const data = await handleResponse(response);
      return { id: data.ticket || data.data?.uuid_solicitud, ...data.data };
    },
    cancel: async (id) => {
      const response = await fetch(`${API_BASE_URL}/solicitudes/${id}/estado`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ estado: 'CANCELADA' })
      });

      const data = await handleResponse(response);
      return data.solicitud || data.data;
    },
    rejectQuotation: async (id, reason) => {
      const response = await fetch(`${API_BASE_URL}/solicitudes/${id}/estado`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ estado: 'RECHAZADA', motivo_rechazo: reason })
      });

      const data = await handleResponse(response);
      return data.solicitud || data.data;
    }
  },
  finances: {
    getBankAccount: async () => {
      const response = await fetch(`${API_BASE_URL}/finanzas/cuenta-bancaria`, {
        method: 'GET',
        headers: getHeaders(true)
      });
      const data = await handleResponse(response);
      return data.data || data;
    },
    registerAdvance: async (requestId, paymentData) => {
      const fileToUpload = paymentData.comprobanteFile || paymentData.comprobante;
      if (fileToUpload instanceof File || fileToUpload instanceof Blob) {
        const headers = { 'Accept': 'application/json' };
        const token = localStorage.getItem('sigesto_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const formData = new FormData();
        if (paymentData.monto_pagado || paymentData.monto) {
          formData.append('monto_pagado', String(paymentData.monto_pagado || paymentData.monto));
        }
        if (paymentData.metodo_pago || paymentData.banco) {
          formData.append('metodo_pago', paymentData.metodo_pago || paymentData.banco);
        }
        if (paymentData.nro_operacion || paymentData.numero_operacion) {
          formData.append('nro_operacion', paymentData.nro_operacion || paymentData.numero_operacion);
        }
        formData.append('comprobante', fileToUpload);

        const response = await fetch(`${API_BASE_URL}/finanzas/${requestId}/adelanto`, {
          method: 'POST',
          headers,
          body: formData
        });
        const data = await handleResponse(response);
        return data;
      }

      const payload = {
        monto_pagado: paymentData.monto_pagado || paymentData.monto,
        metodo_pago: paymentData.metodo_pago || paymentData.banco,
        nro_operacion: paymentData.nro_operacion || paymentData.numero_operacion,
        url_comprobante: paymentData.url_comprobante
      };
      const response = await fetch(`${API_BASE_URL}/finanzas/${requestId}/adelanto`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload)
      });
      const data = await handleResponse(response);
      return data;
    },
    getPaymentsByRequest: async (requestId) => {
      const response = await fetch(`${API_BASE_URL}/finanzas/solicitud/${requestId}`, {
        method: 'GET',
        headers: getHeaders(true)
      });
      const data = await handleResponse(response);
      return data.data || data;
    },
    getAllMyPayments: async () => {
      const response = await fetch(`${API_BASE_URL}/finanzas/mis-pagos`, {
        method: 'GET',
        headers: getHeaders(true)
      });
      const data = await handleResponse(response);
      return data.data || data;
    }
  },
  evidences: {
    getByRequest: async (requestId) => {
      const response = await fetch(`${API_BASE_URL}/evidencias/solicitud/${requestId}`, {
        method: 'GET',
        headers: getHeaders(true)
      });
      const data = await handleResponse(response);
      return data.data || data;
    },
    upload: async (formData) => {
      const headers = { 'Accept': 'application/json' };
      const token = localStorage.getItem('sigesto_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_BASE_URL}/evidencias/subir`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await handleResponse(response);
      return data.data || data;
    }
  }
};