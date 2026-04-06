import React, { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard } from 'lucide-react';

import { useSentinelState } from './hooks/useSentinelState';
import { useAuth } from './hooks/useAuth';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { History } from './pages/History';
import { AddTargetModal } from './components/AddTargetModal';
import { EditTargetModal } from './components/EditTargetModal';
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
  const [targetSearch, setTargetSearch] = useState('');
  const [targetFilter, setTargetFilter] = useState('all');
  const [targetSort, setTargetSort] = useState('priority-desc');
  const [settings, setSettings] = useState({
    pollInterval: 2000,
    failureThreshold: 3,
    eventLimit: 50,
    latencyHistory: 15,
    historyRefreshMs: 15000,
  });

  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const apiUrl = useMemo(() => (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`), [rawApiUrl]);

  useEffect(() => {
    if (!token) return;

    const loadConfig = async () => {
      try {
        const response = await fetch(`${apiUrl}/config`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;
        const data = await response.json();
        setSettings((prev) => ({
          ...prev,
          pollInterval: Number(data?.pollIntervalMs || prev.pollInterval),
          failureThreshold: Number(data?.failureThreshold || prev.failureThreshold),
        }));
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };

    loadConfig();
  }, [apiUrl, token]);

  const handleSaveSettings = async (newSettings) => {
    if (!token) return false;

    try {
      const response = await fetch(`${apiUrl}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pollIntervalMs: Number(newSettings.pollInterval),
          failureThreshold: Number(newSettings.failureThreshold),
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const pollInterval = Number(data?.pollIntervalMs || newSettings.pollInterval);
      const failureThreshold = Number(data?.failureThreshold || newSettings.failureThreshold);
      setSettings({
        ...newSettings,
        pollInterval,
        failureThreshold,
      });
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  };
  
  const {
    services,
    events,
    isSimulating,
    setIsSimulating,
    handleCreateService,
    handleUpdateService,
    handleDeleteService,
  } = useSentinelState({
    token,
    onUnauthorized: logout,
    pollIntervalMs: settings.pollInterval,
    eventLimit: settings.eventLimit,
    latencyHistory: settings.latencyHistory,
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const hasTargetFilters = targetSearch.trim().length > 0 || targetFilter !== 'all';

  const filteredServices = useMemo(() => {
    const term = targetSearch.trim().toLowerCase();

    return services.filter((service) => {
      const status = String(service.status || '').toLowerCase();
      const type = String(service.type || '').toLowerCase();

      const matchesTerm = term.length === 0
        ? true
        : [service.name, service.target, service.type, service.status, service.priority]
          .some((value) => String(value || '').toLowerCase().includes(term));

      let matchesFilter = true;
      if (targetFilter === 'up' || targetFilter === 'down' || targetFilter === 'paused') {
        matchesFilter = status === targetFilter;
      } else if (targetFilter === 'http' || targetFilter === 'ping' || targetFilter === 'port') {
        matchesFilter = type === targetFilter;
      }

      return matchesTerm && matchesFilter;
    });
  }, [services, targetSearch, targetFilter]);

  const sortedServices = useMemo(() => {
    const priorityWeight = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    const statusRiskWeight = {
      DOWN: 4,
      PAUSED: 3,
      UNKNOWN: 2,
      UP: 1,
    };

    const list = [...filteredServices];

    list.sort((a, b) => {
      if (targetSort === 'priority-desc') {
        const pa = priorityWeight[String(a.priority || 'MEDIUM').toUpperCase()] || 0;
        const pb = priorityWeight[String(b.priority || 'MEDIUM').toUpperCase()] || 0;
        if (pb !== pa) return pb - pa;
      }

      if (targetSort === 'status-risk') {
        const sa = statusRiskWeight[String(a.status || 'UNKNOWN').toUpperCase()] || 0;
        const sb = statusRiskWeight[String(b.status || 'UNKNOWN').toUpperCase()] || 0;
        if (sb !== sa) return sb - sa;
      }

      if (targetSort === 'latency-desc') {
        const la = Number(a.latencies?.[a.latencies.length - 1] || 0);
        const lb = Number(b.latencies?.[b.latencies.length - 1] || 0);
        if (lb !== la) return lb - la;
      }

      if (targetSort === 'name-asc') {
        return String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' });
      }

      return String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' });
    });

    return list;
  }, [filteredServices, targetSort]);

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

      {editingService && (
        <EditTargetModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onSave={handleUpdateService}
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
          targetSearch={targetSearch}
          setTargetSearch={setTargetSearch}
          targetFilter={targetFilter}
          setTargetFilter={setTargetFilter}
          targetSort={targetSort}
          setTargetSort={setTargetSort}
          user={user}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-950 p-4 lg:p-6 custom-scrollbar">
          {activeTab === 'dashboard' ? (
            <Dashboard 
              services={sortedServices}
              hasTargetFilters={hasTargetFilters}
              events={events}
              isSimulating={isSimulating}
              onEditService={setEditingService}
              handleDeleteService={handleDeleteService}
              setShowAddModal={setShowAddModal}
            />
          ) : activeTab === 'history' ? (
            <History
              services={sortedServices}
              token={token}
              apiUrl={apiUrl}
              refreshIntervalMs={settings.historyRefreshMs}
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
              <div className="w-16 h-16 mb-4 rounded-xl bg-slate-800/80 flex items-center justify-center shrink-0 border border-slate-700">
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
