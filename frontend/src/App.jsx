import React, { useState } from 'react';
import { LayoutDashboard } from 'lucide-react';

import { useSentinelState } from './hooks/useSentinelState';
import { useAuth } from './hooks/useAuth';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { AddTargetModal } from './components/AddTargetModal';
import { HelpManual } from './components/HelpManual';
import { AuthScreen } from './components/AuthScreen';
import { Configuration } from './components/Configuration';
import { Alerts } from './components/Alerts';

export default function App() {
  const {
    token,
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState({
    pollInterval: 2000,
    failureRate: 0.1,
    eventLimit: 50,
    latencyHistory: 15,
  });

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    // TODO: Save to backend when implemented
  };
  
  const {
    services,
    events,
    isSimulating,
    setIsSimulating,
    handleCreateService,
    handleDeleteService
  } = useSentinelState({ token, onUnauthorized: logout });

  const [showAddModal, setShowAddModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        Cargando sesión...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onLogin={login} onRegister={register} loading={isLoading} />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-50 overflow-hidden font-sans">
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
          border-radius: 20px;
        }
      `}} />

      {showAddModal && (
        <AddTargetModal 
          onClose={() => setShowAddModal(false)} 
          onSave={handleCreateService} 
        />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar 
          activeTab={activeTab}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isSimulating={isSimulating}
          setIsSimulating={setIsSimulating}
          setShowAddModal={setShowAddModal}
          user={user}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-950 p-4 lg:p-6 custom-scrollbar">
          {activeTab === 'dashboard' ? (
            <Dashboard 
              services={services}
              events={events}
              handleDeleteService={handleDeleteService}
              setShowAddModal={setShowAddModal}
            />
          ) : activeTab === 'alertas' ? (
            <Alerts events={events} />
          ) : activeTab === 'configuracion' ? (
            <Configuration 
              settings={settings}
              onSave={handleSaveSettings}
            />
          ) : activeTab === 'ayuda' ? (
            <HelpManual />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 max-w-lg w-full m-auto">
              <div className="w-16 h-16 mb-4 rounded-xl bg-slate-800/80 flex items-center justify-center flex-shrink-0 border border-slate-700">
                <LayoutDashboard className="w-8 h-8 text-slate-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-200 mb-2">
                Módulo: <span className="capitalize text-emerald-400">{activeTab}</span>
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Este módulo se encuentra en construcción. Implementaremos lógica adicional en futuras iteraciones.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
