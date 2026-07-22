import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapController = ({ center }) => {
  const map = useMap();
  React.useEffect(() => {
    if (center && typeof center.lat === 'number' && typeof center.lng === 'number' && !isNaN(center.lat) && !isNaN(center.lng)) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center?.lat, center?.lng, map]);
  return null;
};

const LocationPicker = ({ coordinates, setCoordinates, onLocationSelect }) => {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      setCoordinates({ lat, lng });
      if (onLocationSelect) onLocationSelect(lat, lng);
    },
  });
  return coordinates ? <Marker position={[coordinates.lat, coordinates.lng]} /> : null;
};

import { 
  Zap, 
  Lightbulb, 
  Settings, 
  Flame, 
  FileText, 
  Camera, 
  MapPin, 
  Calendar, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Locate,
  Search,
  Clock,
  Image as ImageIcon
} from 'lucide-react';

const RequestWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados del Formulario Consolidados
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [notasDisponibilidad, setNotasDisponibilidad] = useState('');
  const [materialesCliente, setMaterialesCliente] = useState('');
  const [address, setAddress] = useState(user?.address || '');
  const [coordinates, setCoordinates] = useState({ lat: -12.1221, lng: -77.0305 }); // Ubicación Lima por defecto
  const [includeMapInfo, setIncludeMapInfo] = useState(false); // Marcador opcional para enviar información del mapa (desactivado por defecto)
  const [isEmergency, setIsEmergency] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Tipos de Incidencias con Iconos
  const INCIDENT_TYPES = [
    { id: 'cortocircuito', label: 'Cortocircuito o Apagón', icon: Flame, desc: 'Chispas, olor a quemado, pérdida total o parcial de energía.', color: 'text-rose-500 bg-rose-50 border-rose-100' },
    { id: 'sobrecarga', label: 'Sobrecarga térmica', icon: AlertTriangle, desc: 'Las llaves térmicas caen constantemente al conectar artefactos.', color: 'text-amber-500 bg-amber-50 border-amber-100' },
    { id: 'instalacion', label: 'Instalación y Cableado', icon: Settings, desc: 'Nuevos puntos eléctricos, llaves diferenciales o cableado estructurado.', color: 'text-indigo-500 bg-indigo-50 border-indigo-100' },
    { id: 'luminaria', label: 'Iluminación y Focos', icon: Lightbulb, desc: 'Flickering, fallas de dicroicos, reflectores o instalación de lámparas.', color: 'text-yellow-500 bg-yellow-50 border-yellow-100' },
    { id: 'otros', label: 'Otros problemas', icon: Zap, desc: 'Problemas de puesta a tierra, intercomunicadores u otras fallas.', color: 'text-slate-500 bg-slate-50 border-slate-100' }
  ];

  // Notas predefinidas
  const handleQuickNote = (note) => {
    setNotasDisponibilidad(prev => prev ? `${prev}, ${note}` : note);
  };

  const fetchAddressFromCoords = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`Coordenadas: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (err) {
      console.error("Error geocodificando coordenadas:", err);
      setAddress(`Coordenadas: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const fetchCoordsFromAddress = async (query) => {
    if (!query || !query.trim() || query.startsWith('Coordenadas:')) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0 && data[0].lat && data[0].lon) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCoordinates({ lat, lng });
        setIncludeMapInfo(true);
      }
    } catch (err) {
      console.error("Error buscando dirección en mapa:", err);
    }
  };

  // Geolocalización usando API nativa
  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoordinates({ lat, lng });
          setIncludeMapInfo(true);
          fetchAddressFromCoords(lat, lng);
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
          alert("No se pudo obtener la ubicación. Verifique los permisos.");
        }
      );
    } else {
      alert("Geolocalización no soportada por el navegador.");
    }
  };


  const isScheduledTimeValid = (timeStr) => {
    if (!timeStr) return true;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return true;
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes >= 540 && totalMinutes <= 1320; // 09:00 (540) a 22:00 (1320)
  };

  const handleNext = () => {
    if (step === 1 && !incidentType) {
      alert('Por favor seleccione un tipo de incidencia.');
      return;
    }
    if (step === 2 && (!description || description.trim().length < 10)) {
      alert('Por favor ingrese una descripción detallada de al menos 10 caracteres.');
      return;
    }
    if (step === 3 && !address.trim()) {
      alert('Por favor ingrese su dirección.');
      return;
    }
    if (step === 4) {
      if (!isEmergency) {
        if (!scheduledDate) {
          alert('Por favor ingrese la fecha para programar la visita.');
          return;
        }
        if (scheduledTime && !isScheduledTimeValid(scheduledTime)) {
          alert('El horario preferido debe estar dentro de nuestro horario de atención: entre las 09:00 y las 22:00 horas.');
          return;
        }
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!description || description.trim().length < 10) {
      alert('La descripción debe tener al menos 10 caracteres.');
      return;
    }
    if (!isEmergency) {
      if (!scheduledDate) {
        alert('Por favor ingrese la fecha para programar la visita.');
        return;
      }
      if (scheduledTime && !isScheduledTimeValid(scheduledTime)) {
        alert('El horario preferido debe estar dentro de nuestro horario de atención: entre las 09:00 y las 22:00 horas.');
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const finalAddress = address || `Coordenadas: ${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`;
      const result = await api.requests.create({
        type: INCIDENT_TYPES.find(i => i.id === incidentType)?.label || 'Avería Eléctrica',
        description,
        notasDisponibilidad,
        materiales_cliente: materialesCliente,
        address: finalAddress,
        direccion: finalAddress,
        direccion_servicio: finalAddress,
        coordinates,
        includeMapInfo,
        latitud: includeMapInfo ? coordinates.lat : null,
        longitud: includeMapInfo ? coordinates.lng : null,
        lat: includeMapInfo ? coordinates.lat : null,
        lng: includeMapInfo ? coordinates.lng : null,
        isEmergency,
        es_urgente: isEmergency,
        scheduledDate,
        scheduledTime: scheduledTime || null
      });
      navigate(`/tracking/${result.id}`);
    } catch (err) {
      alert(err.message || 'Error al procesar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (step / 4) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left font-sans">
      
      {/* Cabecera Wizard */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => step > 1 ? handleBack() : navigate('/dashboard')}
          className="p-2 bg-white border border-slate-200/60 text-slate-500 hover:text-slate-800 rounded-xl shadow-soft-sm transition-soft cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display font-extrabold text-xl md:text-2xl text-slate-900">
            Nueva Solicitud de Asistencia
          </h1>
          <p className="text-xs text-slate-400">Paso {step} de 4: {
            step === 1 ? 'Tipo de Incidencia' :
            step === 2 ? 'Detalles y Notas' :
            step === 3 ? 'Ubicación' : 'Planificación de Visita'
          }</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-indigo-600 h-full transition-soft rounded-full" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {/* CARD CONTENEDORA PRINCIPAL */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-6 md:p-8 shadow-soft-lg animate-fade-in relative z-10">
        
        {/* STEP 1: SELECCIÓN DE INCIDENCIA */}
        {step === 1 && (
          <div className="space-y-6 animate-slide-up">
            <div className="space-y-1">
              <h2 className="font-display font-bold text-lg text-slate-900">¿Qué tipo de problema experimenta?</h2>
              <p className="text-xs text-slate-400">Seleccione la categoría de avería eléctrica para acelerar el diagnóstico del especialista.</p>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {INCIDENT_TYPES.map((item) => {
                const isSelected = incidentType === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setIncidentType(item.id)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start space-x-4 transition-soft cursor-pointer ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-50/20 shadow-soft-sm ring-1 ring-indigo-500/20' 
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className={`p-3 rounded-xl shrink-0 ${item.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm">{item.label}</h4>
                      <p className="text-xs text-slate-400 leading-normal mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: DETALLE Y NOTAS DE DISPONIBILIDAD */}
        {step === 2 && (
          <div className="space-y-6 animate-slide-up">
            <div className="space-y-1">
              <h2 className="font-display font-bold text-lg text-slate-900">Detalles del problema</h2>
              <p className="text-xs text-slate-400">Describe brevemente qué ocurrió y agrega notas sobre tu disponibilidad.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Descripción detallada</label>
                <div className="relative">
                  <textarea
                    rows={4}
                    required
                    minLength={10}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describa los síntomas (Ej. Las luces del pasadizo parpadean, la llave del enchufe general no se sostiene al levantarla, hay olor a quemado cerca al tablero general...)"
                    className={`w-full p-4 bg-slate-50 border rounded-2xl text-sm focus:outline-none focus:bg-white transition-soft resize-none ${
                      description && description.trim().length > 0 && description.trim().length < 10
                        ? 'border-rose-300 focus:border-rose-500 bg-rose-50/10'
                        : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                  <div className="flex justify-between items-center px-1 pt-1 text-[11px]">
                    <span className={description && description.trim().length > 0 && description.trim().length < 10 ? 'text-rose-500 font-medium' : 'text-slate-400'}>
                      {description && description.trim().length > 0 && description.trim().length < 10 
                        ? `Mínimo 10 caracteres (faltan ${10 - description.trim().length})`
                        : 'Debe ingresar al menos 10 caracteres detallando el problema.'}
                    </span>
                    <span className={`font-mono ${!description || description.trim().length < 10 ? 'text-slate-400' : 'text-emerald-600 font-semibold'}`}>
                      {(description || '').trim().length} / 10+
                    </span>
                  </div>
                </div>
              </div>

              {/* Notas de Disponibilidad */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Notas de Disponibilidad (Opcional)</label>
                <textarea
                  rows={2}
                  value={notasDisponibilidad}
                  onChange={(e) => setNotasDisponibilidad(e.target.value)}
                  placeholder="Ej: Solo disponible en las mañanas, tocar el timbre fuerte, dejar aviso en portería..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-soft resize-none"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="button" onClick={() => handleQuickNote('Solo por las mañanas')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-indigo-50 text-slate-600 rounded-lg cursor-pointer transition-soft">Solo por las mañanas</button>
                  <button type="button" onClick={() => handleQuickNote('Llamar antes de venir')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-indigo-50 text-slate-600 rounded-lg cursor-pointer transition-soft">Llamar antes de venir</button>
                  <button type="button" onClick={() => handleQuickNote('Dejar en recepción')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-indigo-50 text-slate-600 rounded-lg cursor-pointer transition-soft">Avisar en recepción</button>
                </div>
              </div>

              {/* Materiales del Cliente */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-slate-600">
                  Materiales que ya tiene disponibles (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={materialesCliente}
                  onChange={(e) => setMaterialesCliente(e.target.value)}
                  placeholder="Ej: Ya tengo el tablero de 8 polos y 5 rollos de cable THW 2.5mm. Solo necesito mano de obra..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-soft resize-none"
                />
                <p className="text-[11px] text-slate-400">
                  Si cuenta con repuestos propios o materiales listos para instalar, indíquelo para que el técnico lo tome en cuenta.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: GEOLOCALIZACIÓN */}
        {step === 3 && (
          <div className="space-y-6 animate-slide-up">
            <div className="space-y-1">
              <h2 className="font-display font-bold text-lg text-slate-900">Ubicación del Servicio</h2>
              <p className="text-xs text-slate-400">Ingrese la dirección exacta y ajuste el pin de mapa para orientar al técnico.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Dirección</label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-[50%] -translate-y-[50%] w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      onBlur={() => {
                        if (address && address.trim().length > 4 && !address.startsWith('Coordenadas:')) {
                          fetchCoordsFromAddress(address);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (address && address.trim().length > 3) fetchCoordsFromAddress(address);
                        }
                      }}
                      placeholder="Dirección, Distrito y Referencia"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-soft"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (address && address.trim().length > 3) fetchCoordsFromAddress(address);
                    }}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-soft cursor-pointer flex items-center justify-center shrink-0 shadow-soft-sm"
                    title="Buscar dirección en el mapa"
                  >
                    <Search className="w-5 h-5 text-slate-600" />
                  </button>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-soft cursor-pointer flex items-center justify-center shrink-0 shadow-soft-sm"
                    title="Obtener ubicación actual"
                  >
                    <Locate className="w-5 h-5 text-indigo-500" />
                  </button>
                </div>
              </div>

              {/* MARCADOR OPCIONAL DE MAPA */}
              <div className={`p-4 rounded-2xl border transition-soft ${
                includeMapInfo 
                  ? 'bg-indigo-50/40 border-indigo-200/80 shadow-soft-sm' 
                  : 'bg-slate-50 border-slate-200/70'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3 text-left">
                    <MapPin className={`w-5 h-5 shrink-0 mt-0.5 ${includeMapInfo ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">¿Adjuntar ubicación en el mapa? (Opcional)</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                        Envíe la latitud y longitud exactas del mapa junto con la dirección en caso se encuentre en el lugar del servicio o desee precisarlo.
                      </p>
                    </div>
                  </div>
                  
                  {/* Checkbox Switch / Marcador */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                    <input
                      type="checkbox"
                      checked={includeMapInfo}
                      onChange={(e) => setIncludeMapInfo(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* MAP SIMULATOR OPCIONAL */}
              {includeMapInfo ? (
                <div className="space-y-1.5 animate-slide-up">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
                      <span>Mapa de geolocalización</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Se enviará latitud y longitud
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Lat: {coordinates.lat.toFixed(5)}, Lng: {coordinates.lng.toFixed(5)}
                    </span>
                  </div>

                  <div className="w-full h-48 bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden relative shadow-inner z-0">
                    <MapContainer 
                      center={[coordinates.lat, coordinates.lng]} 
                      zoom={15} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapController center={coordinates} />
                      <LocationPicker coordinates={coordinates} setCoordinates={setCoordinates} onLocationSelect={fetchAddressFromCoords} />
                    </MapContainer>
                    
                    {/* Floating map hint label */}
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm border border-slate-100 rounded-lg px-2.5 py-1 text-[9px] font-semibold text-slate-600 shadow-soft z-[1000] pointer-events-none">
                      Haz click en cualquier punto para mover el Pin y actualizar la dirección
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-center space-y-1.5">
                  <p className="text-xs font-semibold text-slate-600">Envío de coordenadas desactivado</p>
                  <p className="text-[11px] text-slate-400">
                    La solicitud se enviará solo con la dirección en texto (ideal si no se encuentra en el lugar donde se requiere el servicio).
                  </p>
                  <button
                    type="button"
                    onClick={() => setIncludeMapInfo(true)}
                    className="mt-1 inline-flex items-center px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-soft cursor-pointer border border-indigo-200/60"
                  >
                    Activar mapa y adjuntar coordenadas
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: PLANIFICACIÓN */}
        {step === 4 && (
          <div className="space-y-6 animate-slide-up">
            <div className="space-y-1">
              <h2 className="font-display font-bold text-lg text-slate-900">Programación e Importancia</h2>
              <p className="text-xs text-slate-400">Configure la prioridad de atención para calcular tarifas y organizar los recorridos de cuadrilla.</p>
            </div>

            <div className="space-y-6">
              {/* Toggle Emergencia */}
              <div className={`p-5 rounded-2xl border transition-soft ${
                isEmergency 
                  ? 'bg-red-50/30 border-red-200/80 shadow-soft-sm' 
                  : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3 text-left">
                    <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isEmergency ? 'text-red-500' : 'text-slate-400'}`} />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">¿Es una Emergencia Inmediata?</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                        Asignación prioritaria para problemas de alta peligrosidad. Tiempo estimado de arribo: 15-30 minutos. Aplica cargo adicional.
                      </p>
                    </div>
                  </div>
                  
                  {/* Stylized Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setIsEmergency(!isEmergency)}
                    className={`w-12 h-6.5 rounded-full p-1 transition-soft cursor-pointer flex items-center ${
                      isEmergency ? 'bg-red-500 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="w-4.5 h-4.5 bg-white rounded-full shadow-soft"></div>
                  </button>
                </div>
              </div>

              {/* Selector de horario si NO es emergencia */}
              {!isEmergency ? (
                <div className="space-y-4 pt-2">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Programar Fecha de Visita</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Fecha</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-[50%] -translate-y-[50%] w-4.5 h-4.5 text-slate-400" />
                        <input
                          type="date"
                          required
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-soft"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Hora de Visita</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-[50%] -translate-y-[50%] w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                        <input
                          type="time"
                          min="09:00"
                          max="22:00"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-2xl text-sm focus:outline-none focus:bg-white transition-soft ${
                            scheduledTime && !isScheduledTimeValid(scheduledTime)
                              ? 'border-rose-400 text-rose-600 focus:border-rose-500 bg-rose-50/30'
                              : 'border-slate-200 focus:border-indigo-500'
                          }`}
                        />
                      </div>
                      {scheduledTime && !isScheduledTimeValid(scheduledTime) ? (
                        <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center animate-fade-in">
                          <AlertTriangle className="w-3 h-3 mr-1 shrink-0 text-rose-500" />
                          El horario permitido es entre las 09:00 y las 22:00 hrs.
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-indigo-500 shrink-0" />
                          Horario de atención: 09:00 a 22:00 hrs.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-start space-x-3 text-xs text-red-700">
                  <Zap className="w-4 h-4 shrink-0 mt-0.5 text-red-500 animate-pulse fill-red-500" />
                  <div className="space-y-1 leading-relaxed">
                    <span className="font-bold">Asignación Automática Activada:</span>
                    <p>Un técnico certificado disponible en su zona aceptará la orden inmediatamente. No requiere agendar fechas.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTROLES DE NAVEGACIÓN INFERIORES */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="inline-flex items-center px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-soft cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Atrás
            </button>
          ) : (
            <div></div> // Espaciador
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-soft transition-soft hover-lift cursor-pointer"
            >
              Siguiente <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-soft transition-soft hover-lift cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Procesando Solicitud...
                </span>
              ) : (
                <>
                  Confirmar y Enviar <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </button>
          )}
        </div>

      </div>

    </div>
  );
};

export default RequestWizard;
