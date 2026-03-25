import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Server, 
  BellRing, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Play, 
  Plus 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'servicios', label: 'Servicios', icon: Server },
    { id: 'alertas', label: 'Alertas', icon: BellRing },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-50 overflow-hidden font-sans">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Navegación Lateral) */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Branding */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
              <Server className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-bold text-lg tracking-wide text-slate-50">
              NetPulse <span className="text-emerald-400">Sentinel</span>
            </span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 lg:hidden focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors focus:outline-none">
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Navbar (Cabecera Superior) */}
        <header className="h-16 flex-shrink-0 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-md font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 lg:hidden focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <h1 className="text-xl font-semibold text-slate-100 hidden sm:block capitalize">
              {activeTab}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm font-medium text-slate-200 transition-colors focus:outline-none">
              <Play className="w-4 h-4 text-emerald-400" fill="currentColor" />
              <span className="hidden sm:inline">Iniciar Polling</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Objetivo</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 flex flex-col items-center justify-center">
            {/* Placeholder Empty State */}
            <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 max-w-lg w-full">
              <div className="w-16 h-16 mb-4 rounded-xl bg-slate-800/80 flex items-center justify-center flex-shrink-0 border border-slate-700">
                <LayoutDashboard className="w-8 h-8 text-slate-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-200 mb-2">
                Módulo: <span className="capitalize text-emerald-400">{activeTab}</span>
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Este módulo se encuentra actualmente en construcción. Implementaremos gráficas, tablas y lógica de negocio en futuras iteraciones.
              </p>
            </div>
        </main>
      </div>
    </div>
  );
}
