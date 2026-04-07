import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { Dashboard } from './Dashboard';
import { History } from '../pages/History';
import { Reports } from './Reports';
import { Alerts } from './Alerts';
import { Configuration } from './Configuration';
import { HelpManual } from './HelpManual';

export const MainContent = ({
  activeTab,
  sortedServices,
  hasTargetFilters,
  events,
  isSimulating,
  setEditingService,
  handleDeleteService,
  setShowAddModal,
  token,
  apiUrl,
  settings,
  handleSaveSettings,
  updateSession,
  user,
  targetSearch,
  setTargetSearch,
  targetFilter,
  setTargetFilter,
  targetSort,
  setTargetSort,
}) => {
  if (activeTab === 'dashboard') {
    return (
      <Dashboard
        services={sortedServices}
        hasTargetFilters={hasTargetFilters}
        events={events}
        isSimulating={isSimulating}
        onEditService={setEditingService}
        handleDeleteService={handleDeleteService}
        setShowAddModal={setShowAddModal}
        targetSearch={targetSearch}
        setTargetSearch={setTargetSearch}
        targetFilter={targetFilter}
        setTargetFilter={setTargetFilter}
        targetSort={targetSort}
        setTargetSort={setTargetSort}
        denseMode={Boolean(settings?.denseMode)}
      />
    );
  }

  if (activeTab === 'history') {
    return (
      <History
        services={sortedServices}
        token={token}
        apiUrl={apiUrl}
        refreshIntervalMs={settings.historyRefreshMs}
      />
    );
  }

  if (activeTab === 'reportes') {
    return <Reports services={sortedServices} events={events} />;
  }

  if (activeTab === 'alertas') {
    return <Alerts events={events} />;
  }

  if (activeTab === 'configuracion') {
    return <Configuration settings={settings} onSave={handleSaveSettings} token={token} apiUrl={apiUrl} updateSession={updateSession} user={user} />;
  }

  if (activeTab === 'ayuda') {
    return <HelpManual />;
  }

  return (
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
  );
};
