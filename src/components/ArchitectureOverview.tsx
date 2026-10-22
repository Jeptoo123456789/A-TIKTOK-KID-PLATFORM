import React from 'react';
import { ShieldCheck, Film, Users, Lock, Eye, AlertCircle, FileText } from 'lucide-react';

export const ArchitectureOverview: React.FC = () => {
  const videoStates = [
    { name: 'DRAFT', desc: 'Local composition before upload payload dispatch', color: 'text-slate-400' },
    { name: 'UPLOADED', desc: 'Secure multipart upload landed in private temporary storage', color: 'text-blue-400' },
    { name: 'PROCESSING', desc: 'FFmpeg transcoding, thumbnail generation, & heuristic scan', color: 'text-purple-400' },
    { name: 'PENDING_PARENT', desc: 'Child uploads require parent authorization before moderation', color: 'text-amber-400' },
    { name: 'PENDING_MOD', desc: 'Staff review queue. Inaccessible to public feeds & search', color: 'text-orange-400' },
    { name: 'APPROVED', desc: 'Published to approved feed respecting age suitability filters', color: 'text-emerald-400' },
    { name: 'REJECTED', desc: 'Failed policy review; rejection reason logged to creator', color: 'text-rose-400' },
    { name: 'BLOCKED / REMOVED', desc: 'Emergency takedown after safety report triage', color: 'text-red-500' },
  ];

  const roles = [
    {
      role: 'Parent / Guardian',
      scope: 'Create pseudonymous child profiles, set screen-time & curfews, approve child uploads, view activity summaries, grant verifiable consent.',
      badge: 'Parental Authority',
    },
    {
      role: 'Child',
      scope: 'Watch approved videos, vertical scroll, react & save favorites when permitted, report concerns. Zero access to parental settings or adult APIs.',
      badge: 'Safe Protected Mode',
    },
    {
      role: 'Approved Creator',
      scope: 'Upload educational videos, draft captions & descriptions, submit for moderation review, track approval status.',
      badge: 'Content Partner',
    },
    {
      role: 'Safety Moderator',
      scope: 'Triage moderation queue, preview authorized content, evaluate user reports, approve/reject/escalate videos with audit reasons.',
      badge: 'Trust & Safety',
    },
    {
      role: 'Administrator',
      scope: 'Manage categories, user roles, system health, audit logs, featured videos, and platform-wide safety configurations.',
      badge: 'Full Governance',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          Child Safety, Privacy & Governance Architecture
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          KinVid is engineered specifically around child online safety statutes, including Kenya&apos;s Data Protection Act (DPA 2019) Section 33, GDPR-K, and COPPA principles.
        </p>
      </div>

      {/* Video State Machine */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-400" />
            Mandatory Video Publishing State Machine
          </h3>
          <span className="text-xs text-amber-400 font-mono">Server Enforced</span>
        </div>
        <p className="text-xs text-slate-400">
          Unapproved videos are cryptographically isolated in private storage and strictly excluded from feed queries, recommendations, and search APIs.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {videoStates.map((st) => (
            <div key={st.name} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <span className={`text-xs font-mono font-bold ${st.color}`}>{st.name}</span>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Role-Based Access Control Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Role-Based Access Control Matrix (RBAC)
          </h3>
          <span className="text-xs text-indigo-400 font-mono">Principle of Least Privilege</span>
        </div>

        <div className="space-y-3">
          {roles.map((item) => (
            <div
              key={item.role}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{item.role}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {item.badge}
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed max-w-3xl">{item.scope}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Safeguards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Lock className="w-4 h-4 text-emerald-400" />
            Data Minimization
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            No children&apos;s real names, exact geolocations, school identifiers, or contact info are collected. Children operate via pseudonymous aliases.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Eye className="w-4 h-4 text-amber-400" />
            Zero Behavioral Ad Tracking
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            No third-party trackers, retargeting pixels, or dark patterns. Feed ordering is powered solely by explicit category selections and parent curation.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <FileText className="w-4 h-4 text-indigo-400" />
            Verifiable Consent & Auditing
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every parental consent action records timestamp, verification method, version number, and IP hash in an immutable audit ledger.
          </p>
        </div>
      </div>
    </div>
  );
};
