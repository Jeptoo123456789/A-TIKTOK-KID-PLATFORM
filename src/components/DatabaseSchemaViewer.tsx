import React, { useState } from 'react';
import { Database, Table, Layers, Key, Check } from 'lucide-react';

interface EntityMeta {
  name: string;
  tableName: string;
  description: string;
  primaryKey: string;
  foreignKeys: string[];
  fields: { name: string; type: string; required: boolean; notes?: string }[];
}

export const DatabaseSchemaViewer: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<string>('videos');

  const entities: EntityMeta[] = [
    {
      name: 'Adult Account',
      tableName: 'adult_accounts',
      description: 'Parent, guardian, moderator, admin, and approved creator profiles with password hashing and verification flags.',
      primaryKey: 'id',
      foreignKeys: [],
      fields: [
        { name: 'id', type: 'VARCHAR(64)', required: true, notes: 'Prefix acc_*' },
        { name: 'email', type: 'VARCHAR(255)', required: true, notes: 'Unique index, lowercased' },
        { name: 'password_hash', type: 'TEXT', required: true, notes: 'scrypt salted key derivation' },
        { name: 'full_name', type: 'VARCHAR(128)', required: true },
        { name: 'role', type: 'ENUM', required: true, notes: 'parent | guardian | moderator | admin | creator' },
        { name: 'is_verified', type: 'BOOLEAN', required: true, notes: 'Default false until email/ID confirmation' },
        { name: 'consent_accepted_at', type: 'TIMESTAMP', required: false, notes: 'Parental consent audit timestamp' },
        { name: 'created_at', type: 'TIMESTAMP', required: true, notes: 'UTC' },
      ],
    },
    {
      name: 'Child Profile',
      tableName: 'child_profiles',
      description: 'Pseudonymous profiles managed by parents with age classifications and preferences.',
      primaryKey: 'id',
      foreignKeys: ['parent_account_id -> adult_accounts.id'],
      fields: [
        { name: 'id', type: 'VARCHAR(64)', required: true, notes: 'Prefix child_*' },
        { name: 'parent_account_id', type: 'VARCHAR(64)', required: true, notes: 'Foreign key to adult_accounts' },
        { name: 'display_name', type: 'VARCHAR(64)', required: true, notes: 'Pseudonymous child alias' },
        { name: 'avatar_icon', type: 'VARCHAR(32)', required: true, notes: 'Emoji/icon badge' },
        { name: 'age', type: 'INTEGER', required: true, notes: 'Range 2-16' },
        { name: 'max_age_suitability', type: 'INTEGER', required: true, notes: 'Hard filter for video ratings' },
        { name: 'preferred_categories', type: 'JSONB/ARRAY', required: false },
        { name: 'created_at', type: 'TIMESTAMP', required: true },
      ],
    },
    {
      name: 'Parental Consent',
      tableName: 'parental_consents',
      description: 'Verifiable parental consent records compliant with Kenya DPA 2019 and global child safety statutes.',
      primaryKey: 'id',
      foreignKeys: ['parent_account_id -> adult_accounts.id'],
      fields: [
        { name: 'id', type: 'VARCHAR(64)', required: true },
        { name: 'parent_account_id', type: 'VARCHAR(64)', required: true },
        { name: 'consent_version', type: 'VARCHAR(32)', required: true, notes: 'e.g. v2026.1-DPA-COPPA' },
        { name: 'verification_method', type: 'VARCHAR(64)', required: true },
        { name: 'verified_timestamp', type: 'TIMESTAMP', required: true },
        { name: 'ip_address_hash', type: 'VARCHAR(64)', required: true, notes: 'One-way SHA-256 for privacy' },
        { name: 'jurisdiction', type: 'VARCHAR(8)', required: true, notes: 'KE, US, etc.' },
      ],
    },
    {
      name: 'Video',
      tableName: 'videos',
      description: 'Core vertical video registry with multi-stage moderation state machine and creator attribution.',
      primaryKey: 'id',
      foreignKeys: ['category_id -> categories.id', 'creator_id -> adult_accounts.id'],
      fields: [
        { name: 'id', type: 'VARCHAR(64)', required: true, notes: 'Prefix vid_*' },
        { name: 'title', type: 'VARCHAR(255)', required: true },
        { name: 'description', type: 'TEXT', required: false },
        { name: 'category_id', type: 'VARCHAR(64)', required: true },
        { name: 'creator_id', type: 'VARCHAR(64)', required: true },
        { name: 'uploader_type', type: 'ENUM', required: true, notes: 'creator | child' },
        { name: 'age_suitability', type: 'INTEGER', required: true, notes: 'Min age rating' },
        { name: 'duration_seconds', type: 'INTEGER', required: true, notes: 'Max 60s' },
        { name: 'video_url', type: 'TEXT', required: true },
        { name: 'thumbnail_url', type: 'TEXT', required: true },
        { name: 'status', type: 'ENUM', required: true, notes: 'DRAFT | UPLOADED | PROCESSING | PENDING_PARENT_APPROVAL | PENDING_MODERATION | APPROVED | REJECTED | BLOCKED | REMOVED' },
        { name: 'view_count', type: 'INTEGER', required: true, notes: 'Default 0' },
        { name: 'like_count', type: 'INTEGER', required: true, notes: 'Default 0' },
        { name: 'favorite_count', type: 'INTEGER', required: true, notes: 'Default 0' },
        { name: 'is_featured', type: 'BOOLEAN', required: true },
      ],
    },
    {
      name: 'Parental Settings',
      tableName: 'parental_settings',
      description: 'Granular per-child controls for screen-time, curfews, allowed categories, and feature toggles.',
      primaryKey: 'id',
      foreignKeys: ['child_profile_id -> child_profiles.id'],
      fields: [
        { name: 'id', type: 'VARCHAR(64)', required: true },
        { name: 'child_profile_id', type: 'VARCHAR(64)', required: true, notes: 'Unique 1-to-1' },
        { name: 'daily_screen_time_minutes', type: 'INTEGER', required: true, notes: 'e.g. 45' },
        { name: 'bedtime_start', type: 'TIME', required: true, notes: 'e.g. 20:00' },
        { name: 'bedtime_end', type: 'TIME', required: true, notes: 'e.g. 07:00' },
        { name: 'allowed_categories', type: 'ARRAY/JSONB', required: false },
        { name: 'blocked_video_ids', type: 'ARRAY/JSONB', required: false },
        { name: 'video_creation_enabled', type: 'BOOLEAN', required: true },
        { name: 'social_reactions_enabled', type: 'BOOLEAN', required: true },
        { name: 'curated_mode_only', type: 'BOOLEAN', required: true },
      ],
    },
    {
      name: 'Content Category',
      tableName: 'categories',
      description: 'Educational topic taxonomy (Science, Math, Animals, Art, Storytime, Music, Safe Comedy).',
      primaryKey: 'id',
      foreignKeys: [],
      fields: [
        { name: 'id', type: 'VARCHAR(64)', required: true, notes: 'cat_*' },
        { name: 'slug', type: 'VARCHAR(64)', required: true, notes: 'Unique index' },
        { name: 'name', type: 'VARCHAR(128)', required: true },
        { name: 'description', type: 'TEXT', required: false },
        { name: 'icon', type: 'VARCHAR(64)', required: true },
        { name: 'display_order', type: 'INTEGER', required: true },
        { name: 'is_active', type: 'BOOLEAN', required: true },
        { name: 'min_age', type: 'INTEGER', required: true },
        { name: 'max_age', type: 'INTEGER', required: true },
      ],
    },
    {
      name: 'Content Report',
      tableName: 'content_reports',
      description: 'Child-safe reporting tickets with categorization, reporter anonymity, and moderator resolution.',
      primaryKey: 'id',
      foreignKeys: ['video_id -> videos.id'],
      fields: [
        { name: 'id', type: 'VARCHAR(64)', required: true },
        { name: 'video_id', type: 'VARCHAR(64)', required: true },
        { name: 'reporter_id', type: 'VARCHAR(64)', required: true },
        { name: 'reason', type: 'ENUM', required: true, notes: 'inappropriate | harassment | dangerous | exploitation | other' },
        { name: 'details', type: 'TEXT', required: true },
        { name: 'status', type: 'ENUM', required: true, notes: 'OPEN | UNDER_REVIEW | RESOLVED | DISMISSED' },
        { name: 'resolved_by', type: 'VARCHAR(64)', required: false },
      ],
    },
    {
      name: 'Audit Log',
      tableName: 'audit_logs',
      description: 'Immutable trail of administrative, moderation, and parental consent events for accountability.',
      primaryKey: 'id',
      foreignKeys: [],
      fields: [
        { name: 'id', type: 'VARCHAR(64)', required: true },
        { name: 'actor_id', type: 'VARCHAR(64)', required: true },
        { name: 'actor_role', type: 'VARCHAR(32)', required: true },
        { name: 'action', type: 'VARCHAR(128)', required: true },
        { name: 'entity_type', type: 'VARCHAR(64)', required: true },
        { name: 'entity_id', type: 'VARCHAR(64)', required: true },
        { name: 'metadata', type: 'JSONB', required: false },
        { name: 'timestamp', type: 'TIMESTAMP', required: true },
      ],
    },
  ];

  const current = entities.find((e) => e.tableName === selectedEntity) || entities[0];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-400" />
          Normalized Relational Database Architecture
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          KinVid uses a strictly normalized database model satisfying Section 17 requirements. Features foreign keys, unique email and slug indexes, ACID disk persistence with WAL logging, and automated version migrations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Selector */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
            Database Entities ({entities.length})
          </div>
          {entities.map((item) => (
            <button
              key={item.tableName}
              onClick={() => setSelectedEntity(item.tableName)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                selectedEntity === item.tableName
                  ? 'bg-slate-800 border-amber-400/80 text-white shadow-sm'
                  : 'bg-slate-850 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Table className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold">{item.name}</span>
              </div>
              <span className="text-xs font-mono text-slate-500">{item.tableName}</span>
            </button>
          ))}
        </div>

        {/* Selected Entity Details */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{current.name}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                  {current.tableName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{current.description}</p>
            </div>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-400">
                <Key className="w-3.5 h-3.5" /> PK: {current.primaryKey}
              </span>
            </div>
          </div>

          {current.foreignKeys.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold">Foreign Key Constraints: </span>
              <span className="text-indigo-400 font-mono">{current.foreignKeys.join(', ')}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Column</th>
                  <th className="pb-3 font-semibold">Data Type</th>
                  <th className="pb-3 font-semibold">Required</th>
                  <th className="pb-3 font-semibold">Constraints / Semantics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {current.fields.map((field) => (
                  <tr key={field.name} className="hover:bg-slate-800/30">
                    <td className="py-2.5 text-white font-semibold flex items-center gap-1.5">
                      {field.name === current.primaryKey && <Key className="w-3 h-3 text-amber-400" />}
                      {field.name}
                    </td>
                    <td className="py-2.5 text-amber-300/90">{field.type}</td>
                    <td className="py-2.5 text-slate-400">
                      {field.required ? (
                        <span className="text-emerald-400">NOT NULL</span>
                      ) : (
                        <span className="text-slate-500">NULLABLE</span>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-400 font-sans text-xs">{field.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
