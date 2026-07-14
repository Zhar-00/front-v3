import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Wrench, 
  CreditCard, 
  User, 
  LogOut, 
  Bell, 
  ShieldCheck,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const notificationsRef = useRef(null);

  // Cerrar notificaciones al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notificaciones dinámicas (vacío por defecto hasta integrar módulo futuro)
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Nueva Solicitud', path: '/wizard', icon: Wrench },
    { name: 'Pagos y Facturas', path: '/payments', icon: CreditCard },
    { name: 'Mi Perfil', path: '/profile', icon: User }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 md:flex-row">
      
      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200/60 shadow-soft-sm z-30">
        {/* Brand/Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-soft">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-slate-900">SIGESTO</span>
              <span className="block text-[10px] text-slate-400 font-semibold tracking-wider -mt-1 uppercase">Portal Clientes</span>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 font-display font-semibold flex items-center justify-center text-sm shadow-inner">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{user?.name}</p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-soft ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-600 shadow-soft-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.name}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-indigo-500" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-soft cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-3 text-slate-400" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & BOTTOM NAV */}
      <header className="md:hidden sticky top-0 bg-white border-b border-slate-200/60 shadow-soft-sm z-30 px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-500 rounded-lg text-white">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-slate-900">SIGESTO</span>
        </Link>

        <div className="flex items-center space-x-3">
          {/* Bell Icon mobile */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {/* User Initial Circle */}
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 font-display font-semibold flex items-center justify-center text-xs shadow-inner">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
          </div>
          
          {/* Burger Menu for Logout */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer (Only for logout and extra stuff) */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-x-0 top-14 bg-white border-b border-slate-200 shadow-soft-lg z-20 px-4 py-4 space-y-3">
          <div className="px-2 pb-2 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-soft cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión de la Cuenta
          </button>
        </div>
      )}

      {/* 3. MAIN WORKSPACE AREA */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200/60 items-center justify-between px-8 sticky top-0 z-20">
          <div>
            <h2 className="text-sm font-semibold text-slate-500 font-sans tracking-wide">
              {navItems.find(i => i.path === location.pathname)?.name || 'Detalles del Servicio'}
            </h2>
          </div>

          <div className="flex items-center space-x-6">
            {/* Bell Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-soft relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1.5 w-4 h-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200/70 shadow-soft-lg rounded-2xl p-4 z-40">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="font-display font-semibold text-sm text-slate-800">Notificaciones</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllRead}
                        className="text-[11px] font-medium text-indigo-500 hover:text-indigo-600 cursor-pointer"
                      >
                        Marcar como leídas
                      </button>
                    )}
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`p-2 rounded-xl text-xs transition-soft ${notif.read ? 'bg-white' : 'bg-indigo-50/50'}`}
                        >
                          <p className={`text-slate-700 leading-normal ${!notif.read && 'font-medium'}`}>{notif.text}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{notif.time}</span>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center">
                        <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">No tienes notificaciones pendientes.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-slate-200"></div>

            {/* User profile dropdown trigger */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Cliente Sigesto</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 font-display font-semibold flex items-center justify-center text-sm shadow-inner">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </div>
              
              {/* Header Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 ml-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-soft cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-8 max-w-7xl xl:max-w-[1440px] mx-auto w-full">
          {children}
        </main>
      </div>

      {/* 4. MOBILE BOTTOM NAV (Mobile-First) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200/60 shadow-lg z-30 flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center w-20 h-full transition-soft ${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
};

export default Layout;
