// API_BASE_URL se lee desde las variables de entorno de Vite o se usa un fallback ficticio
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.sigesto.example.com/v1';

// Simulación de retardo de red para emular un comportamiento real (Loading states en UI)
const delay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para obtener datos de localStorage
const getStorageItem = (key, defaultValue) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

// Helper para guardar en localStorage
const setStorageItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Datos semilla iniciales (Seeder)
const SEED_REQUESTS = [
  {
    id: 'REQ-101',
    type: 'Cortocircuito y Apagón',
    description: 'Hubo un chispazo en el tablero general de la cocina y nos quedamos sin energía en todo el primer piso. Huele un poco a quemado.',
    photo: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80',
    location: {
      address: 'Av. Larco 743, Miraflores, Lima',
      coordinates: { lat: -12.1221, lng: -77.0305 }
    },
    isEmergency: true,
    scheduledDate: '',
    scheduledTime: '',
    status: 'En camino', // Pendiente, Asignado, En camino, En ejecución, Finalizado, Cancelado
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // hace 30 minutos
    technician: {
      id: 'TECH-007',
      name: 'Carlos Mendoza',
      photo: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&q=80',
      rating: 4.8,
      vehicle: 'Motocicleta Suzuki',
      plate: '4532-8B',
      phone: '+51 987 654 321',
      eta: '12 min'
    },
    quotation: {
      id: 'COT-501',
      status: 'Pendiente', // Pendiente, Aprobada, Rechazada, Cambios Solicitados
      feedback: '',
      items: [
        { desc: 'Diagnóstico de falla y cortocircuito en tablero', qty: 1, price: 45.00 },
        { desc: 'Interruptor termo-magnético Schneider 32A', qty: 2, price: 28.50 },
        { desc: 'Cableado de cobre THW 12 AWG (metros)', qty: 8, price: 4.20 },
        { desc: 'Mano de obra especializada en tableros', qty: 1, price: 60.00 }
      ],
      subtotal: 195.60,
      tax: 35.21, // 18% IGV
      total: 230.81
    },
    payment: {
      status: 'Pendiente', // Pendiente, Pagado
      amount: 230.81,
      date: ''
    },
    review: null
  },
  {
    id: 'REQ-102',
    type: 'Instalación de Luminaria',
    description: 'Instalación de 5 reflectores LED en jardín exterior y colocación de temporizador horario en tablero.',
    photo: '',
    location: {
      address: 'Calle Los Cedros 124, San Isidro, Lima',
      coordinates: { lat: -12.0954, lng: -77.0358 }
    },
    isEmergency: false,
    scheduledDate: '2026-06-05',
    scheduledTime: '10:00 - 12:00',
    status: 'Asignado',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // hace 2 días
    technician: {
      id: 'TECH-012',
      name: 'Manuel Guerrero',
      photo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80',
      rating: 4.9,
      vehicle: 'Furgón Hyundai H1',
      plate: 'F3G-902',
      phone: '+51 912 345 678',
      eta: 'Programado para el 05/06'
    },
    quotation: null,
    payment: {
      status: 'Pendiente',
      amount: 0.00,
      date: ''
    },
    review: null
  },
  {
    id: 'REQ-103',
    type: 'Sobrecarga y Cambio de Llave',
    description: 'Se cae la llave térmica constantemente al encender la terma y la lavadora al mismo tiempo. Necesito revisar la potencia.',
    photo: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=600&q=80',
    location: {
      address: 'Av. Brasil 2340, Jesús María, Lima',
      coordinates: { lat: -12.0792, lng: -77.0498 }
    },
    isEmergency: false,
    scheduledDate: '2026-06-01',
    scheduledTime: '15:00 - 17:00',
    status: 'Finalizado',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    technician: {
      id: 'TECH-003',
      name: 'Jorge Luis Ortiz',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      rating: 4.7,
      vehicle: 'Pick-up Toyota Hilux',
      plate: 'A4C-112',
      phone: '+51 934 567 890',
      eta: 'Completado'
    },
    quotation: {
      id: 'COT-500',
      status: 'Aprobada',
      feedback: '',
      items: [
        { desc: 'Balance de cargas e inspección', qty: 1, price: 30.00 },
        { desc: 'Llave termo-magnética 40A Legrand', qty: 1, price: 35.00 },
        { desc: 'Mano de obra de cambio e instalación', qty: 1, price: 40.00 }
      ],
      subtotal: 105.00,
      tax: 18.90,
      total: 123.90
    },
    payment: {
      status: 'Pagado',
      amount: 123.90,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    review: null // Listo para calificar en la demo!
  }
];

// Inicializar localStorage si no hay datos
if (!localStorage.getItem('sigesto_requests')) {
  setStorageItem('sigesto_requests', SEED_REQUESTS);
}

if (!localStorage.getItem('sigesto_users')) {
  setStorageItem('sigesto_users', [
    {
      id: 'USR-001',
      name: 'Daniela Alva',
      email: 'daniela.alva@gmail.com',
      phone: '987654321',
      address: 'Av. Larco 743, Miraflores',
      password: 'password123'
    }
  ]);
}

// Interceptor de token Bearer (Simulado en los headers)
const getHeaders = () => {
  const token = localStorage.getItem('sigesto_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const api = {
  // === SERVICIOS DE AUTENTICACIÓN ===
  auth: {
    login: async (email, password) => {
      console.log(`[API POST] ${API_BASE_URL}/auth/login - payload:`, { email });
      await delay(1000);
      
      const users = getStorageItem('sigesto_users', []);
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      
      if (!user) {
        throw new Error('Credenciales inválidas. Por favor verifique el correo y contraseña.');
      }
      
      const mockToken = `mock-jwt-token-for-user-${user.id}`;
      localStorage.setItem('sigesto_token', mockToken);
      localStorage.setItem('sigesto_current_user', JSON.stringify(user));
      
      return { user, token: mockToken };
    },

    register: async (userData) => {
      console.log(`[API POST] ${API_BASE_URL}/auth/register - payload:`, userData);
      await delay(1200);
      
      const users = getStorageItem('sigesto_users', []);
      const exists = users.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
      
      if (exists) {
        throw new Error('El correo electrónico ya se encuentra registrado.');
      }
      
      const newUser = {
        id: `USR-${Math.floor(100 + Math.random() * 900)}`,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address || '',
        password: userData.password
      };
      
      users.push(newUser);
      setStorageItem('sigesto_users', users);
      
      // Auto login después del registro
      const mockToken = `mock-jwt-token-for-user-${newUser.id}`;
      localStorage.setItem('sigesto_token', mockToken);
      localStorage.setItem('sigesto_current_user', JSON.stringify(newUser));
      
      return { user: newUser, token: mockToken };
    },

    recoverPassword: async (email) => {
      console.log(`[API POST] ${API_BASE_URL}/auth/recover-password - payload:`, { email });
      await delay(800);
      
      const users = getStorageItem('sigesto_users', []);
      const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!exists) {
        throw new Error('El correo electrónico ingresado no coincide con ninguna cuenta activa.');
      }
      
      return { message: 'Se ha enviado un enlace de recuperación a su correo electrónico.' };
    },

    updateProfile: async (profileData) => {
      console.log(`[API PUT] ${API_BASE_URL}/auth/profile - payload:`, profileData, getHeaders());
      await delay(1000);
      
      const currentUser = getStorageItem('sigesto_current_user', null);
      if (!currentUser) throw new Error('No autorizado.');
      
      const updatedUser = { ...currentUser, ...profileData };
      localStorage.setItem('sigesto_current_user', JSON.stringify(updatedUser));
      
      // Actualizar también en el listado general de usuarios
      const users = getStorageItem('sigesto_users', []);
      const index = users.findIndex(u => u.id === currentUser.id);
      if (index !== -1) {
        users[index] = { ...users[index], ...profileData };
        setStorageItem('sigesto_users', users);
      }
      
      return updatedUser;
    },

    logout: async () => {
      await delay(300);
      localStorage.removeItem('sigesto_token');
      localStorage.removeItem('sigesto_current_user');
      return true;
    }
  },

  // === MÓDULO DE SOLICITUDES (CLIENTE) ===
  requests: {
    getAll: async () => {
      console.log(`[API GET] ${API_BASE_URL}/requests`, getHeaders());
      await delay(800);
      return getStorageItem('sigesto_requests', []);
    },

    getById: async (id) => {
      console.log(`[API GET] ${API_BASE_URL}/requests/${id}`, getHeaders());
      await delay(500);
      const requests = getStorageItem('sigesto_requests', []);
      const req = requests.find(r => r.id === id);
      if (!req) throw new Error('Solicitud no encontrada.');
      return req;
    },

    create: async (requestData) => {
      console.log(`[API POST] ${API_BASE_URL}/requests - payload:`, requestData, getHeaders());
      await delay(1500);
      
      const requests = getStorageItem('sigesto_requests', []);
      
      const newRequest = {
        id: `REQ-${Math.floor(104 + Math.random() * 900)}`,
        type: requestData.type,
        description: requestData.description,
        photo: requestData.photo || '', // base64 simulado o url
        location: {
          address: requestData.address,
          coordinates: requestData.coordinates || { lat: -12.0464, lng: -77.0428 }
        },
        isEmergency: requestData.isEmergency,
        scheduledDate: requestData.scheduledDate || '',
        scheduledTime: requestData.scheduledTime || '',
        status: 'Pendiente',
        createdAt: new Date().toISOString(),
        technician: null,
        quotation: null,
        payment: {
          status: 'Pendiente',
          amount: 0.00,
          date: ''
        },
        review: null
      };

      // Si es de emergencia, auto-asignamos un técnico ficticio a los pocos segundos
      // para mejorar la experiencia de usuario del simulador.
      if (newRequest.isEmergency) {
        newRequest.status = 'Asignado';
        newRequest.technician = {
          id: 'TECH-001',
          name: 'Roberto Gómez',
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          rating: 4.9,
          vehicle: 'Furgoneta Fiat Fiorino',
          plate: 'B5X-711',
          phone: '+51 999 888 777',
          eta: '15 min'
        };
        newRequest.quotation = {
          id: `COT-${Math.floor(600 + Math.random() * 300)}`,
          status: 'Pendiente',
          feedback: '',
          items: [
            { desc: 'Atención Técnica de Emergencia Eléctrica', qty: 1, price: 80.00 },
            { desc: 'Revisión y descarte de fugas de corriente', qty: 1, price: 40.00 }
          ],
          subtotal: 120.00,
          tax: 21.60,
          total: 141.60
        };
        newRequest.payment.amount = 141.60;
      }
      
      requests.unshift(newRequest); // Agregar al inicio
      setStorageItem('sigesto_requests', requests);
      
      return newRequest;
    },

    // APLICACIÓN DEL AJUSTE ESTRATÉGICO: Soft-Delete (No borrado real)
    cancel: async (id) => {
      console.log(`[API PUT/PATCH] ${API_BASE_URL}/requests/${id}/cancel - payload: { status: 'Cancelado' }`, getHeaders());
      await delay(1000);
      
      const requests = getStorageItem('sigesto_requests', []);
      const index = requests.findIndex(r => r.id === id);
      
      if (index === -1) {
        throw new Error('Solicitud no encontrada.');
      }
      
      // Actualizar el estado de la solicitud a 'Cancelado'
      requests[index].status = 'Cancelado';
      
      setStorageItem('sigesto_requests', requests);
      return requests[index];
    }
  },

  // === GESTIÓN DE COTIZACIONES ===
  quotations: {
    approve: async (requestId) => {
      console.log(`[API POST] ${API_BASE_URL}/requests/${requestId}/quotation/approve`, getHeaders());
      await delay(1200);
      
      const requests = getStorageItem('sigesto_requests', []);
      const index = requests.findIndex(r => r.id === requestId);
      
      if (index === -1 || !requests[index].quotation) {
        throw new Error('Cotización no encontrada.');
      }
      
      requests[index].quotation.status = 'Aprobada';
      // Pasamos de "Asignado" a "En camino" o "En ejecución" una vez aprobada
      if (requests[index].status === 'Asignado' || requests[index].status === 'Pendiente') {
        requests[index].status = 'En camino';
      }
      
      // Actualizamos el monto del pago
      requests[index].payment.amount = requests[index].quotation.total;
      
      setStorageItem('sigesto_requests', requests);
      return requests[index];
    },

    reject: async (requestId) => {
      console.log(`[API POST] ${API_BASE_URL}/requests/${requestId}/quotation/reject`, getHeaders());
      await delay(1000);
      
      const requests = getStorageItem('sigesto_requests', []);
      const index = requests.findIndex(r => r.id === requestId);
      
      if (index === -1 || !requests[index].quotation) {
        throw new Error('Cotización no encontrada.');
      }
      
      requests[index].quotation.status = 'Rechazada';
      
      setStorageItem('sigesto_requests', requests);
      return requests[index];
    },

    requestChanges: async (requestId, feedback) => {
      console.log(`[API POST] ${API_BASE_URL}/requests/${requestId}/quotation/changes`, { feedback }, getHeaders());
      await delay(1200);
      
      const requests = getStorageItem('sigesto_requests', []);
      const index = requests.findIndex(r => r.id === requestId);
      
      if (index === -1 || !requests[index].quotation) {
        throw new Error('Cotización no encontrada.');
      }
      
      requests[index].quotation.status = 'Cambios Solicitados';
      requests[index].quotation.feedback = feedback;
      
      setStorageItem('sigesto_requests', requests);
      return requests[index];
    }
  },

  // === PAGOS Y COMPROBANTES ===
  payments: {
    pay: async (requestId, paymentDetails) => {
      console.log(`[API POST] ${API_BASE_URL}/requests/${requestId}/payment`, paymentDetails, getHeaders());
      await delay(2000); // Dar realismo a la pasarela
      
      const requests = getStorageItem('sigesto_requests', []);
      const index = requests.findIndex(r => r.id === requestId);
      
      if (index === -1) {
        throw new Error('Solicitud no encontrada.');
      }
      
      requests[index].payment.status = 'Pagado';
      requests[index].payment.date = new Date().toISOString();
      // Si el pago se procesa, simulamos que el técnico finaliza su servicio
      requests[index].status = 'Finalizado';
      
      setStorageItem('sigesto_requests', requests);
      return requests[index];
    }
  },

  // === FEEDBACK Y CALIFICACIONES ===
  reviews: {
    submit: async (requestId, rating, comment) => {
      console.log(`[API POST] ${API_BASE_URL}/requests/${requestId}/review`, { rating, comment }, getHeaders());
      await delay(800);
      
      const requests = getStorageItem('sigesto_requests', []);
      const index = requests.findIndex(r => r.id === requestId);
      
      if (index === -1) {
        throw new Error('Solicitud no encontrada.');
      }
      
      requests[index].review = {
        rating,
        comment,
        createdAt: new Date().toISOString()
      };
      
      setStorageItem('sigesto_requests', requests);
      return requests[index];
    }
  }
};
