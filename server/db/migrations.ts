/**
 * KinVid Database Migration Runner
 * Handles automatic schema versions, migrations, and structural integrity.
 */

import { DatabaseState } from './schema.js';

export interface Migration {
  version: number;
  name: string;
  up: (db: DatabaseState) => void;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: '001_initial_schema',
    up: (db: DatabaseState) => {
      // Ensure all arrays exist
      db.adultAccounts = db.adultAccounts || [];
      db.parentalConsents = db.parentalConsents || [];
      db.childProfiles = db.childProfiles || [];
      db.parentalSettings = db.parentalSettings || [];
      db.categories = db.categories || [];
      db.videos = db.videos || [];
      db.videoStorageRefs = db.videoStorageRefs || [];
      db.processingJobs = db.processingJobs || [];
      db.reactions = db.reactions || [];
      db.favorites = db.favorites || [];
      db.screenTimeUsage = db.screenTimeUsage || [];
      db.contentReports = db.contentReports || [];
      db.moderationDecisions = db.moderationDecisions || [];
      db.auditLogs = db.auditLogs || [];
    },
  },
  {
    version: 2,
    name: '002_add_indexes_and_defaults',
    up: (db: DatabaseState) => {
      // Ensure categories have displayOrder and isActive
      db.categories.forEach((cat, index) => {
        if (cat.displayOrder === undefined) cat.displayOrder = index + 1;
        if (cat.isActive === undefined) cat.isActive = true;
      });
      // Ensure videos have proper like and favorite counters
      db.videos.forEach((vid) => {
        if (vid.likeCount === undefined) vid.likeCount = 0;
        if (vid.favoriteCount === undefined) vid.favoriteCount = 0;
        if (vid.viewCount === undefined) vid.viewCount = 0;
      });
    },
  },
];

export function runMigrations(db: DatabaseState): { appliedCount: number; currentVersion: number } {
  const startingVersion = db.version || 0;
  let appliedCount = 0;

  for (const migration of migrations) {
    if (migration.version > startingVersion) {
      console.log(`[Database Migration] Applying migration v${migration.version}: ${migration.name}`);
      migration.up(db);
      db.version = migration.version;
      appliedCount++;
    }
  }

  return { appliedCount, currentVersion: db.version };
}
