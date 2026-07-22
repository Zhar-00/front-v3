# Contexto del Proyecto: mi-proyecto

## 1. Stack Tecnológico y Configuración
- **Framework/Librería:** React 19 + Vite 8
- **Lenguaje:** JavaScript (ESNext / JSX)
- **Gestión de Estado:** Context API (AuthContext / AuthProvider) y Estado Local (useState / useEffect)
- **Librería de UI / Estilos:** Tailwind CSS v4 (@tailwindcss/vite) + Vanilla CSS (App.css, index.css) + Iconos lucide-react
- **Enrutamiento:** React Router v7 (react-router-dom)
- **Cliente HTTP / Peticiones:** Fetch API nativo encapsulado con helpers e interceptores personalizados en `src/services/api.js`
- **Manejador de Formularios y Validación:** Estado local controlado de React (useState) y validación manual en cliente complementada con captura de errores de validación del backend (HTTP 422)
- **Variables de Entorno Clave:** `VITE_API_BASE_URL` (definida en `.env`, `.env.development`, `.env.production` y referenciada para configurar la URL base de la API backend)

## 2. Estructura del Proyecto
- `src/assets/`: Contiene recursos estáticos multimedia e imágenes utilizados en la interfaz de usuario.
- `src/components/`: Almacena componentes transversales de layout y UI compartidos como navegación principal, rutas protegidas y notificaciones toast.
- `src/context/`: Define el contexto global de autenticación (`AuthContext`) y su proveedor para gestionar la sesión del usuario.
- `src/services/`: Centraliza el cliente HTTP modularizado (`api.js`) y endpoints para comunicación con el backend (autenticación, solicitudes, finanzas y evidencias).
- `src/views/`: Agrupa las páginas y vistas principales de la aplicación divididas en públicas (`LandingPage`), autenticación (`auth/`) y portal privado (`portal/`).

## 3. Enrutamiento y Mapa de Navegación
| Ruta | Componente / Vista | Tipo (Pública / Protegida) | Descripción / Propósito |
|---|---|---|---|
| `/` | `LandingPage` | Pública | Página de bienvenida e introducción al servicio con llamados a la acción para registro o inicio de sesión |
| `/login` | `Login` | Pública | Formulario de autenticación para acceso de clientes al portal mediante email y contraseña |
| `/register` | `Register` | Pública | Formulario de registro para nuevos clientes (nombres, apellidos, email, DNI/RUC, teléfono, dirección) |
| `/forgot-password` | `ForgotPassword` | Pública | Vista para solicitud de recuperación y restablecimiento de contraseña mediante correo electrónico |
| `/dashboard` | `Dashboard` | Protegida (`Layout`) | Panel de control principal del cliente con métricas rápidas, resúmenes y accesos directos a solicitudes |
| `/wizard` | `RequestWizard` | Protegida (`Layout`) | Asistente paso a paso para la creación de nuevas solicitudes de asistencia técnica e instalación |
| `/tracking/:id` | `RequestTracking` | Protegida (`Layout`) | Vista detallada para el seguimiento del estado operativo, financiero y carga de evidencias de una solicitud específica |
| `/payments` | `PaymentView` | Protegida (`Layout`) | Historial y gestión de pagos realizados, comprobantes pendientes y consulta de cuentas bancarias |
| `/profile` | `Profile` | Protegida (`Layout`) | Administración de los datos personales del perfil del cliente, seguridad y resumen general de cuenta |
| `/*` | `Navigate to="/"` | Pública | Redirección comodín (`fallback`) que envía cualquier ruta no coincidente o inexistente hacia la página de inicio |

## 4. Estado Global y Custom Hooks
- **Stores / Contextos:**
  - `AuthContext`: Almacena la sesión activa del cliente (`user`), el token JWT de autorización (`token`), el estado de carga (`loading`) y un booleano derivado de autenticación (`isAuthenticated`). Proporciona acciones principales para iniciar sesión (`login`), registrar nuevos usuarios (`register`), cerrar sesión (`logout`), actualizar perfil (`updateProfile`) y recuperar contraseña (`recoverPassword`). Además, restaura automáticamente la sesión desde `localStorage` (`sigesto_current_user` y `sigesto_token`) al cargar la aplicación.
- **Custom Hooks (`src/hooks`):**
  - No aplica. No existe un directorio `src/hooks` ni custom hooks independientes creados en la arquitectura del proyecto; se utilizan los hooks nativos de React (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`) junto con el hook consumidor interno `useAuth` del `AuthContext`.

## 5. Integración con APIs y Servicios Backend
- **Configuración Base:** La base URL está configurada hacia `https://cornflowerblue-wallaby-868308.hostingersite.com/api` (o vía variable de entorno `VITE_API_BASE_URL`). El cliente HTTP encapsula la API `fetch` nativa adjuntando automáticamente el encabezado `Authorization: Bearer <sigesto_token>` y `Content-Type: application/json` mediante la función helper `getHeaders()`. Cuenta con un interceptor global de respuestas `handleResponse()` que procesa errores HTTP: los errores `401` limpian la sesión local y redirigen al usuario a `/login`, los errores `403`, `400`, `409` y `>= 500` emiten eventos personalizados de notificación emergente (`api-toast`), y los errores `422` extraen y formatean los mensajes de validación devueltos por el servidor.
- **Servicios/Endpoints:**
  - `api.auth` (`/auth` y `/usuarios`):
    - `POST /auth/login`: Autenticación del usuario y verificación de rol exclusivo `CLIENTE`.
    - `POST /auth/registrar`: Registro de nuevos clientes en el sistema.
    - `POST /auth/forgot-password`: Solicitud de envío de enlace para recuperación de contraseña.
    - `GET /usuarios/perfil`: Obtención del perfil y datos completos del usuario autenticado.
    - `PUT /usuarios/perfil`: Actualización de la información personal del perfil y seguridad.
    - `POST /auth/logout`: Cierre e invalidación de la sesión en el servidor.
  - `api.requests` (`/solicitudes`):
    - `GET /solicitudes/mis-solicitudes`: Listado de todas las solicitudes de asistencia y trabajo del cliente.
    - `GET /solicitudes/:id`: Detalle completo e historial de una solicitud específica por ID.
    - `POST /solicitudes`: Creación de una nueva solicitud de servicio técnico.
    - `POST /solicitudes/:id/estado`: Cancelación o actualización del estado de una solicitud (`CANCELADO`).
  - `api.payments` y `api.finances` (`/finanzas`):
    - `GET /finanzas/cuenta-bancaria`: Obtención de datos bancarios y cuentas para transferencias.
    - `POST /finanzas/:requestId/adelanto`: Registro y subida de comprobantes de pago/transferencia (adelantos o liquidaciones del saldo).
    - `GET /finanzas/solicitud/:requestId`: Obtención del estado financiero y resumen de pagos de una solicitud.
    - `GET /finanzas/mis-pagos`: Listado general del historial de pagos y transacciones del cliente.
  - `api.evidences` (`/evidencias`):
    - `GET /evidencias/solicitud/:requestId`: Consulta de archivos e imágenes de evidencia adjuntos a un servicio.
    - `POST /evidencias/subir`: Subida de nuevas evidencias fotográficas o documentales al servidor.

## 6. Catálogo de Componentes
- **Componentes Globales / UI (`src/components/`):**
  - `Layout.jsx`: Estructura envolvente principal del portal privado que orquesta la barra de navegación lateral (`Sidebar`), la barra superior (`Header`) con información del usuario/notificaciones y el contenedor de vista principal con diseño responsivo. Props obligatorias: `children` (contenido dinámico de la vista activa).
  - `ProtectedRoute.jsx`: Componente de orden superior que valida si el usuario está autenticado (`isAuthenticated` y `loading` de `useAuth`). Si no hay sesión activa, redirige automáticamente a `/login`; en caso contrario, renderiza el Outlet o los componentes hijos (`children`).
  - `Toast.jsx`: Sistema global de notificaciones emergentes (`Toast`) basado en eventos del navegador (`window.dispatchEvent('api-toast')`). Escucha y renderiza alertas visuales temporales categorizadas por tipo (`error`, `warning`, `success`, `info`). No requiere props directas ya que opera de manera flotante y autónoma mediante eventos.
- **Componentes Complejos / Módulos:**
  - `RequestTracking.jsx`: Módulo central de seguimiento que orquesta la conciliación entre el *Flujo Operativo* (`EN_PROCESO`, `FINALIZADA`, etc.) y el *Estado Financiero* (`Cotizado`, `Abonado`, `En Revisión`, `Pagado / Liquidado`). Incluye lógicas avanzadas para clasificación de comprobantes, subida de transferencias, cálculo de porcentajes abonados y renderizado de evidencias.
  - `RequestWizard.jsx`: Asistente interactivo multi-paso que guía al cliente en la creación de solicitudes de servicio, recolectando tipo de servicio, ubicación, preferencias de fecha/hora (con validación de horario comercial de 09:00 a 22:00) y descripción detallada del problema antes de enviar el payload al backend.
  - `Dashboard.jsx`: Panel de agregación que resume el estado general de la cuenta del cliente, calculando estadísticas operativas y financieras en tiempo real y presentando listados filtrables de solicitudes activas y recientes.
  - `PaymentView.jsx`: Módulo de control financiero del cliente que compila el historial general de transacciones, saldos pendientes por orden, visualización de comprobantes y consulta de cuentas bancarias receptoras.

## 7. Instrucciones de Ejecución
- Comandos principales detectados en `package.json`:
  - `npm run dev` (`vite`): Inicia el servidor de desarrollo local con recarga rápida (HMR).
  - `npm run build` (`vite build`): Compila y empaqueta la aplicación en modo producción dentro de la carpeta `dist/`.
  - `npm run lint` (`eslint .`): Ejecuta el linter ESLint en todo el proyecto para verificar estándares de código y reglas de React Hooks.
  - `npm run preview` (`vite preview`): Levanta un servidor local para previsualizar el build de producción generado en `dist/`.
