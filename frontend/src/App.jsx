import React, { useEffect, useMemo, useState } from 'react';

import { useSentinelState } from './hooks/useSentinelState';
import { useAuth } from './hooks/useAuth';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { AddTargetModal } from './components/AddTargetModal';
import { EditTargetModal } from './components/EditTargetModal';
import { AuthScreen } from './components/AuthScreen';
import { MainContent } from './components/MainContent';
import { buildAuthHeaders, getApiUrl } from './lib/api';
import { hasPermission } from './lib/permissions';

export default function App() {
  const {
    token,
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateSession,
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
    denseMode: false,
  });

  const apiUrl = getApiUrl();

  useEffect(() => {
    if (!token) return;

    const loadConfig = async () => {
      try {
        const response = await fetch(`${apiUrl}/config`, {
          headers: buildAuthHeaders(token),
        });

        if (!response.ok) return;
        const data = await response.json();
        setSettings((prev) => ({
          ...prev,
          pollInterval: Number(data?.pollIntervalMs ?? prev.pollInterval),
          failureThreshold: Number(data?.failureThreshold ?? prev.failureThreshold),
          eventLimit: Number(data?.eventLimit ?? prev.eventLimit),
          latencyHistory: Number(data?.latencyHistory ?? prev.latencyHistory),
          historyRefreshMs: Number(data?.historyRefreshMs ?? prev.historyRefreshMs),
          denseMode: Boolean(data?.denseMode ?? prev.denseMode),
        }));
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };

    loadConfig();
  }, [apiUrl, token]);

  useEffect(() => {
    if (!user) return;

    if (activeTab === 'configuracion' && !hasPermission(user, 'configuration.access')) {
      setActiveTab('dashboard');
    }
  }, [activeTab, user]);

  const handleSaveSettings = async (newSettings) => {
    if (!token) return false;

    try {
      const response = await fetch(`${apiUrl}/config`, {
        method: 'PUT',
        headers: buildAuthHeaders(token),
        body: JSON.stringify({
          pollIntervalMs: Number(newSettings.pollInterval),
          failureThreshold: Number(newSettings.failureThreshold),
          eventLimit: Number(newSettings.eventLimit),
          latencyHistory: Number(newSettings.latencyHistory),
          historyRefreshMs: Number(newSettings.historyRefreshMs),
          denseMode: Boolean(newSettings.denseMode),
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const pollInterval = Number(data?.pollIntervalMs ?? newSettings.pollInterval);
      const failureThreshold = Number(data?.failureThreshold ?? newSettings.failureThreshold);
      const eventLimit = Number(data?.eventLimit ?? newSettings.eventLimit);
      const latencyHistory = Number(data?.latencyHistory ?? newSettings.latencyHistory);
      const historyRefreshMs = Number(data?.historyRefreshMs ?? newSettings.historyRefreshMs);
      const denseMode = Boolean(data?.denseMode ?? newSettings.denseMode);
      setSettings({
        ...newSettings,
        pollInterval,
        failureThreshold,
        eventLimit,
        latencyHistory,
        historyRefreshMs,
        denseMode,
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
      } else if (targetFilter === 'critical') {
        matchesFilter = String(service.priority || '').toUpperCase() === 'CRITICAL';
      } else if (targetFilter === 'issues') {
        matchesFilter = status === 'down' || status === 'paused';
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
        user={user}
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
          <MainContent
            activeTab={activeTab}
            sortedServices={sortedServices}
            hasTargetFilters={hasTargetFilters}
            events={events}
            isSimulating={isSimulating}
            setEditingService={setEditingService}
            handleDeleteService={handleDeleteService}
            setShowAddModal={setShowAddModal}
            token={token}
            apiUrl={apiUrl}
            settings={settings}
            handleSaveSettings={handleSaveSettings}
            updateSession={updateSession}
            user={user}
            targetSearch={targetSearch}
            setTargetSearch={setTargetSearch}
            targetFilter={targetFilter}
            setTargetFilter={setTargetFilter}
            targetSort={targetSort}
            setTargetSort={setTargetSort}
          />
        </main>
      </div>
    </div>
  );
}
