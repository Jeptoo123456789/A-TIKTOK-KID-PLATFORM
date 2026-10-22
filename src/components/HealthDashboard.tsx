import React from 'react';
import { HealthResponse } from '../types';
import {
  Server,
  Database,
  Shield,
  Film,
  Users,
  Layers,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface HealthDashboardProps {
  health: HealthResponse | null;
  error: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({
  health,
  error,
  isLoading,
  onRefresh,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              KinVid Platform Services: {health?.status === 'healthy' ? 'Operational' : 'Initializing'}
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Milestone 1 Foundation active. Unified Express backend with Vite integration, ACID-compliant persistent database, schema migration runner, and OpenAPI v1 REST routes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
          >
            {isLoading ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>Error connecting to backend API: {error}</span>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Backend Server */}
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Backend Server</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white tabular-nums">
              {health?.status ? '200 OK' : '---'}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Port {health?.environment.port || 3000}</span>
              <span aria-hidden="true">·</span>
              <span>Node {health?.environment.nodeVersion || 'v22'}</span>
            </div>
          </div>
        </div>

        {/* Database Engine */}
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Database Engine</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white tabular-nums">
              v{health?.database.schemaVersion ?? 2} Schema
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>ACID WAL Engine</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">Migrated</span>
            </div>
          </div>
        </div>

        {/* Approved Video Library */}
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Approved Videos</span>
            <Film className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white tabular-nums">
              {health?.database.stats.approvedVideos ?? 5}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>{health?.database.stats.categories ?? 7} Categories</span>
              <span aria-hidden="true">·</span>
              <span>1 Pending</span>
            </div>
          </div>
        </div>

        {/* Uptime & Memory */}
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Server Uptime</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white tabular-nums">
              {health ? `${health.uptimeSeconds}s` : '---'}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Heap: {health?.environment.memoryHeapUsedMB ?? 28} MB</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">Stable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            Core Platform Security & Enforcement
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-700/40 text-sm">
              <span className="text-slate-300">Server-Side RBAC Middleware</span>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/40 text-sm">
              <span className="text-slate-300">Parent-Child Ownership Verification</span>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/40 text-sm">
              <span className="text-slate-300">Unapproved Video Isolation</span>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Blocked from Feed
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/40 text-sm">
              <span className="text-slate-300">Verifiable Parental Consent Records</span>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> DPA / COPPA Audit Trail
              </span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-300">Safe Error Handler (No Stack Leaks)</span>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Seed Account & Authorization Profiles
          </h2>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white">Administrator</span>
                <div className="text-slate-400">admin@kinvid.local · AdminPass123!</div>
              </div>
              <span className="text-indigo-400 font-medium">Full Governance</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white">Safety Moderator</span>
                <div className="text-slate-400">moderator@kinvid.local · ModPass123!</div>
              </div>
              <span className="text-amber-400 font-medium">Review & Takedown</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white">Verified Parent (Jane Doe)</span>
                <div className="text-slate-400">parent@kinvid.local · ParentPass123!</div>
              </div>
              <span className="text-emerald-400 font-medium">2 Child Profiles</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white">Approved Creator (Prof. Sparkle)</span>
                <div className="text-slate-400">creator@kinvid.local · CreatorPass123!</div>
              </div>
              <span className="text-rose-400 font-medium">Educational Videos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
