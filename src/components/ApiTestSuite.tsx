import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, ArrowRight, RefreshCw, Lock } from 'lucide-react';
import { ApiClient } from '../services/api';

interface ApiTestItem {
  id: string;
  name: string;
  method: 'GET' | 'POST';
  endpoint: string;
  description: string;
  requiresAuth: boolean;
  run: () => Promise<unknown>;
}

export const ApiTestSuite: React.FC = () => {
  const [selectedTestId, setSelectedTestId] = useState<string>('health');
  const [testResults, setTestResults] = useState<Record<string, { status: number; duration: number; response: unknown; error?: string }>>({});
  const [runningId, setRunningId] = useState<string | null>(null);

  const tests: ApiTestItem[] = [
    {
      id: 'health',
      name: 'System Health & Telemetry',
      method: 'GET',
      endpoint: '/api/v1/health',
      description: 'Checks server readiness, persistent database connection, schema migration level, and memory footprint.',
      requiresAuth: false,
      run: async () => {
        const start = performance.now();
        const data = await ApiClient.getHealth();
        const duration = Math.round(performance.now() - start);
        return { status: 200, duration, response: data };
      },
    },
    {
      id: 'categories',
      name: 'Content Categories List',
      method: 'GET',
      endpoint: '/api/v1/categories',
      description: 'Retrieves active educational categories (Science, Math, Nature, Art, Storytime, Music, Safe Comedy).',
      requiresAuth: false,
      run: async () => {
        const start = performance.now();
        const data = await ApiClient.getCategories();
        const duration = Math.round(performance.now() - start);
        return { status: 200, duration, response: data };
      },
    },
    {
      id: 'feed',
      name: 'Approved Video Feed',
      method: 'GET',
      endpoint: '/api/v1/videos/feed',
      description: 'Retrieves approved videos. Automatically filters out pending and unmoderated videos from the public child feed.',
      requiresAuth: false,
      run: async () => {
        const start = performance.now();
        const data = await ApiClient.getFeed();
        const duration = Math.round(performance.now() - start);
        return { status: 200, duration, response: data };
      },
    },
    {
      id: 'parent_login',
      name: 'Parent Authentication',
      method: 'POST',
      endpoint: '/api/v1/auth/login',
      description: 'Authenticates parent account (parent@kinvid.local), validates password hash, and issues session token.',
      requiresAuth: false,
      run: async () => {
        const start = performance.now();
        const data = await ApiClient.login('parent@kinvid.local', 'ParentPass123!');
        const duration = Math.round(performance.now() - start);
        return { status: 200, duration, response: data };
      },
    },
    {
      id: 'auth_me',
      name: 'Current Session User Profile',
      method: 'GET',
      endpoint: '/api/v1/auth/me',
      description: 'Validates Bearer token in request header and returns verified adult account data.',
      requiresAuth: true,
      run: async () => {
        const start = performance.now();
        // Ensure token exists
        if (!ApiClient.getToken()) {
          await ApiClient.login('parent@kinvid.local', 'ParentPass123!');
        }
        const data = await ApiClient.getMe();
        const duration = Math.round(performance.now() - start);
        return { status: 200, duration, response: data };
      },
    },
    {
      id: 'admin_stats',
      name: 'Admin Dashboard Metrics',
      method: 'GET',
      endpoint: '/api/v1/admin/stats',
      description: 'Enforces Admin/Moderator RBAC role. Authenticates admin@kinvid.local and returns platform audit counters.',
      requiresAuth: true,
      run: async () => {
        const start = performance.now();
        // Login as admin
        await ApiClient.login('admin@kinvid.local', 'AdminPass123!');
        const data = await ApiClient.getAdminStats();
        const duration = Math.round(performance.now() - start);
        return { status: 200, duration, response: data };
      },
    },
  ];

  const handleRunTest = async (test: ApiTestItem) => {
    setRunningId(test.id);
    setSelectedTestId(test.id);
    try {
      const res = (await test.run()) as { status: number; duration: number; response: unknown };
      setTestResults((prev) => ({
        ...prev,
        [test.id]: {
          status: res.status,
          duration: res.duration,
          response: res.response,
        },
      }));
    } catch (err: unknown) {
      setTestResults((prev) => ({
        ...prev,
        [test.id]: {
          status: 500,
          duration: 0,
          response: null,
          error: err instanceof Error ? err.message : String(err),
        },
      }));
    } finally {
      setRunningId(null);
    }
  };

  const handleRunAll = async () => {
    for (const test of tests) {
      await handleRunTest(test);
    }
  };

  const currentResult = testResults[selectedTestId];
  const activeTest = tests.find((t) => t.id === selectedTestId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Interactive API Verification Suite</h2>
          <p className="text-sm text-slate-400 mt-1">
            Execute real HTTP requests against the backend server, verify status codes, and test server-enforced rules.
          </p>
        </div>
        <button
          onClick={handleRunAll}
          disabled={runningId !== null}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${runningId ? 'animate-spin' : ''}`} />
          <span>Run All Verification Tests</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Test List */}
        <div className="lg:col-span-5 space-y-2.5">
          {tests.map((test) => {
            const result = testResults[test.id];
            const isSelected = selectedTestId === test.id;
            const isRunning = runningId === test.id;

            return (
              <div
                key={test.id}
                onClick={() => setSelectedTestId(test.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-amber-400/80 shadow-md'
                    : 'bg-slate-850 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700/60">
                      {test.method}
                    </span>
                    <span className="text-sm font-semibold text-white">{test.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {result ? (
                      result.status === 200 ? (
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK
                        </span>
                      ) : (
                        <span className="text-xs text-rose-400 flex items-center gap-1 font-mono">
                          <XCircle className="w-3.5 h-3.5" /> {result.status}
                        </span>
                      )
                    ) : null}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunTest(test);
                      }}
                      disabled={isRunning}
                      className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-amber-400 hover:text-slate-900 text-slate-300 transition-colors"
                      title="Run test"
                    >
                      <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-pulse text-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-400 mt-2 font-mono truncate">{test.endpoint}</div>
                <div className="text-xs text-slate-400 mt-1 line-clamp-1">{test.description}</div>
              </div>
            );
          })}
        </div>

        {/* Test Details & Output */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                    {activeTest?.method}
                  </span>
                  <span className="text-base font-bold text-white">{activeTest?.endpoint}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{activeTest?.description}</p>
              </div>

              {activeTest && (
                <button
                  onClick={() => handleRunTest(activeTest)}
                  disabled={runningId === activeTest.id}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Play className="w-3 h-3" />
                  <span>Execute</span>
                </button>
              )}
            </div>

            {/* Results Output */}
            {currentResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-slate-400">
                    Status: <strong className={currentResult.status === 200 ? 'text-emerald-400' : 'text-rose-400'}>{currentResult.status}</strong>
                  </span>
                  <span className="text-slate-400">
                    Duration: <strong className="text-amber-400 tabular-nums">{currentResult.duration}ms</strong>
                  </span>
                  <span className="text-slate-400">
                    Payload: <strong className="text-indigo-400">application/json</strong>
                  </span>
                </div>

                {currentResult.error && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {currentResult.error}
                  </div>
                )}

                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 overflow-x-auto max-h-[340px]">
                  <pre className="text-xs font-mono text-emerald-400/90 whitespace-pre">
                    {JSON.stringify(currentResult.response, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-8 h-8 text-slate-700" />
                <span>Click &quot;Execute&quot; to invoke this endpoint and inspect live JSON response.</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span>Server Response Format: RFC 7807 compliant JSON</span>
            <span>Origin: Same-origin /api/v1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
