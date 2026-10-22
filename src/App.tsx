import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HealthDashboard } from './components/HealthDashboard';
import { ApiTestSuite } from './components/ApiTestSuite';
import { DatabaseSchemaViewer } from './components/DatabaseSchemaViewer';
import { ArchitectureOverview } from './components/ArchitectureOverview';
import { ApiClient } from './services/api';
import { HealthResponse } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState<boolean>(true);

  const fetchHealth = useCallback(async () => {
    setIsHealthLoading(true);
    setHealthError(null);
    try {
      const data = await ApiClient.getHealth();
      setHealthData(data);
    } catch (err: unknown) {
      setHealthError(err instanceof Error ? err.message : 'Unable to connect to server API');
    } finally {
      setIsHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPingHealth={fetchHealth}
        isPinging={isHealthLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'overview' && (
          <HealthDashboard
            health={healthData}
            error={healthError}
            isLoading={isHealthLoading}
            onRefresh={fetchHealth}
          />
        )}

        {activeTab === 'api-test' && <ApiTestSuite />}

        {activeTab === 'database' && <DatabaseSchemaViewer />}

        {activeTab === 'architecture' && <ArchitectureOverview />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">KinVid Child Video Platform</span>
            <span aria-hidden="true">·</span>
            <span>Milestone 1: Foundation Completed</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>DPA 2019 / COPPA Architecture</span>
            <span aria-hidden="true">·</span>
            <span>Zero-Tracking Policy</span>
            <span aria-hidden="true">·</span>
            <span>Server-Authoritative RBAC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
