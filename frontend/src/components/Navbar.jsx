import React from 'react';
import { Menu, Play, Plus, Pause } from 'lucide-react';

export const Navbar = ({ activeTab, setIsMobileMenuOpen, isSimulating, setIsSimulating, setShowAddModal }) => {
  return (
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
        <button 
          onClick={() => setIsSimulating(!isSimulating)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors focus:outline-none ${
            isSimulating 
              ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 hover:bg-rose-500/20' 
              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
          }`}
        >
          {isSimulating ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 text-emerald-400" fill="currentColor" />
          )}
          <span className="hidden sm:inline">{isSimulating ? 'Pausar Polling' : 'Iniciar Polling'}</span>
        </button>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-sm font-medium text-white transition-colors focus:outline-none shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo Objetivo</span>
        </button>
      </div>
    </header>
  );
};
