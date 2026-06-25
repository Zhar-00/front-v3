import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  CheckCircle, 
  Star,
  Users,
  Wrench,
  Smartphone
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* 1. NAVEGACIÓN */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-50 shadow-soft-sm">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-soft">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-slate-900">SIGESTO</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <a href="#beneficios" className="hover:text-indigo-600 transition-soft">Beneficios</a>
          <a href="#soluciones" className="hover:text-indigo-600 transition-soft">Soluciones</a>
          <a href="#social" className="hover:text-indigo-600 transition-soft">Testimonios</a>
        </nav>

        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <Link 
              to="/dashboard" 
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-soft transition-soft hover-lift"
            >
              Ir al Portal <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 transition-soft"
              >
                Iniciar Sesión
              </Link>
              <Link 
                to="/register" 
                className="inline-flex items-center justify-center px-4.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-soft transition-soft hover-lift"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </header>

      {/* 2. HERO SECTION (Embudo Comercial) */}
      <section className="relative px-6 py-16 md:py-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="flex-1 text-left space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
            <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
            <span className="text-[10px] md:text-xs font-semibold text-indigo-700 uppercase tracking-wider">Atención Eléctrica Inmediata 24/7</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight">
            Gestión inteligente de <span className="text-indigo-600 bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">servicios técnicos</span> en tu hogar o empresa
          </h1>

          <p className="text-slate-500 text-base md:text-lg max-w-xl font-normal leading-relaxed">
            SIGESTO conecta tus necesidades eléctricas con técnicos certificados en tiempo real. Solicita visitas programadas o atención de emergencias con presupuestos claros y seguimiento GPS en vivo.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link 
              to={isAuthenticated ? "/wizard" : "/login?redirect=/wizard"} 
              className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-soft-lg transition-soft hover-lift text-center"
            >
              Solicitar Asistencia Eléctrica
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
            <a 
              href="#beneficios" 
              className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-2xl shadow-soft-sm hover:bg-slate-50 transition-soft text-center"
            >
              Conocer más
            </a>
          </div>

          {/* Micro badges of social proof under CTA */}
          <div className="pt-4 flex items-center space-x-6 text-slate-400 text-xs">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Garantía de 90 días</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Técnicos homologados</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Mockup Representing the Client Portal */}
        <div className="flex-1 w-full max-w-lg md:max-w-none">
          <div className="relative p-3 bg-white border border-slate-100 rounded-3xl shadow-soft-lg transition-soft hover:scale-[1.01]">
            <div className="absolute -top-4 -left-4 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-soft flex items-center space-x-1 animate-bounce">
              <Clock className="w-3 h-3" />
              <span>ETA Técnico: 12 min</span>
            </div>
            
            {/* Mock interface header */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/60">
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-3 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping"></div>
                  <span className="text-xs font-semibold text-slate-800">Servicio en Curso: REQ-101</span>
                </div>
                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">En Camino</span>
              </div>

              {/* Mock Stepper */}
              <div className="flex justify-between items-center py-2 px-1 mb-4">
                {['Pendiente', 'Asignado', 'En camino'].map((s, idx) => (
                  <div key={s} className="flex flex-col items-center flex-1 relative">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${
                      idx === 2 ? 'bg-indigo-600 text-white shadow-soft' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="text-[9px] font-semibold text-slate-500 mt-1.5">{s}</span>
                    {idx < 2 && (
                      <div className="absolute left-[50%] top-3 w-[100%] h-0.5 bg-indigo-100 -z-0"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Technician Info Mock */}
              <div className="bg-white rounded-xl p-3 border border-slate-100/80 shadow-soft-sm flex items-center space-x-3">
                <img 
                  src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=100&q=80" 
                  alt="Técnico" 
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="flex-1 text-left">
                  <p className="text-xs font-bold text-slate-800">Carlos Mendoza</p>
                  <p className="text-[10px] text-slate-400">Especialista en Cortocircuitos</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-0.5" /> 4.8
                  </div>
                  <span className="text-[10px] text-slate-400">Suzuki 4532-8B</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BENEFICIOS */}
      <section id="beneficios" className="bg-white border-y border-slate-200/50 py-20 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900">
              ¿Por qué elegir a SIGESTO?
            </h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed">
              Diseñamos una plataforma integral pensando en la transparencia, rapidez y seguridad de cada instalación o reparación eléctrica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 bg-slate-50 border border-slate-100 rounded-3xl text-left space-y-4 transition-soft hover-lift">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl w-fit">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">Atención en Minutos</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Nuestros algoritmos conectan tu solicitud al técnico más cercano de inmediato en emergencias eléctricas críticas.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-8 bg-slate-50 border border-slate-100 rounded-3xl text-left space-y-4 transition-soft hover-lift">
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl w-fit">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">Personal Verificado</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Todos los operadores aprueban exámenes de antecedentes y pruebas técnicas exhaustivas antes de ser homologados.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-8 bg-slate-50 border border-slate-100 rounded-3xl text-left space-y-4 transition-soft hover-lift">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl w-fit">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">Presupuesto Cerrado</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Visualiza una cotización digital clara desglosada ítem por ítem. Aprueba, rechaza o solicita modificaciones antes del inicio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN COMERCIAL / PASOS */}
      <section id="soluciones" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6 text-left">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 leading-tight">
              Una experiencia móvil diseñada para la conversión directa
            </h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed">
              Ya sea desde un anuncio de redes sociales o mediante búsqueda directa, SIGESTO te permite reportar tu incidente eléctrico en segundos con nuestro Wizard optimizado.
            </p>

            <div className="space-y-4">
              <div className="flex items-start space-x-3.5">
                <div className="p-1 bg-indigo-100 text-indigo-600 rounded-lg mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Diseño Mobile-First Eficiente</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Reporta fugas, cortocircuitos o instalaciones directo desde tu smartphone sin necesidad de instalar apps pesadas.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="p-1 bg-indigo-100 text-indigo-600 rounded-lg mt-0.5">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Categorización Gráfica</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Selección visual mediante tarjetas intuitivas que reduce errores de entrada y agiliza la asignación técnica.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="p-1 bg-indigo-100 text-indigo-600 rounded-lg mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Geolocalización Asistida</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Simulador de mapa integrado para marcar las coordenadas del siniestro exacto, ahorrando llamadas de coordinación molestas.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Steps Demo */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-soft-sm text-left">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Paso 1</span>
              <h4 className="font-display font-bold text-base text-slate-900 mt-1 mb-2">Selección de Falla</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Tarjetas ilustradas de averías eléctricas generales, termas, luminarias o sobrecargas térmicas.</p>
            </div>
            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-soft-sm text-left">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Paso 2</span>
              <h4 className="font-display font-bold text-base text-slate-900 mt-1 mb-2">Evidencia Fotográfica</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Arrastra o fotografía la avería para enviar al técnico un contexto visual completo.</p>
            </div>
            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-soft-sm text-left">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Paso 3</span>
              <h4 className="font-display font-bold text-base text-slate-900 mt-1 mb-2">Ubicación Precisa</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Mapa para ajustar el pin exacto de llegada y coordenadas de soporte.</p>
            </div>
            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-soft-sm text-left">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Paso 4</span>
              <h4 className="font-display font-bold text-base text-slate-900 mt-1 mb-2">Prioridad y Hora</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Configura visita inmediata por emergencia o agenda la visita técnica según tu disponibilidad.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRUEBA SOCIAL / TESTIMONIOS (Oculto temporalmente hasta integración con backend) */}
      {/* 
      <section id="social" className="bg-slate-50 py-20 px-6 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-display font-bold text-3xl text-slate-900">Opiniones de clientes satisfechos</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
              Empresas y hogares ya gestionan el mantenimiento de sus instalaciones eléctricas de manera digital e integrada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-soft-sm text-center">
              <p className="text-slate-400 text-sm italic">Módulo de testimonios en construcción...</p>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* 6. PIE DE PÁGINA */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-white text-lg tracking-tight">SIGESTO</span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; 2026 SIGESTO. Todos los derechos reservados. Sistema Integrado de Gestión de Servicios Técnicos y Operaciones.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
