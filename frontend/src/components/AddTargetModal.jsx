import React, { useState } from 'react';
import { Globe, X } from 'lucide-react';

export const AddTargetModal = ({ onClose, onSave }) => {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('HTTP');
  const [newTarget, setNewTarget] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onSave({
      newName: newName.trim(),
      newType,
      newTarget: newTarget.trim()
    });
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/20">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Añadir Nuevo Objetivo
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Nombre del Servicio</label>
            <input 
              required 
              type="text" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
              placeholder="Ej. API de Pagos" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Tipo de Protocolo</label>
            <select 
              value={newType} 
              onChange={e => setNewType(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
            >
              <option value="HTTP">HTTP/HTTPS</option>
              <option value="PING">ICMP Ping</option>
              <option value="PORT">TCP Port</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Objetivo (URL o IP)</label>
            <input 
              required 
              type="text" 
              value={newTarget} 
              onChange={e => setNewTarget(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
              placeholder="Ej. https://api.midominio.com" 
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all"
            >
              Guardar Objetivo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
