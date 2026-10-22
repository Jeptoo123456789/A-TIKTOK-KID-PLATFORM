/**
 * KinVid Milestone 1 Automated Test Suite
 * Verifies core foundation: database engine, migrations, health check, password security,
 * and role-based access control.
 */

import { db, hashPassword, verifyPassword } from '../server/db/database.js';
import { runMigrations } from '../server/db/migrations.js';
import { generateToken, verifyToken } from '../server/middleware/auth.js';
import { AdultAccount } from '../server/db/schema.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   RUNNING KINVID MILESTONE 1 VERIFICATION TESTS');
  console.log('======================================================\n');

  // Test 1: Database Initialization
  console.log('1. Database Engine & Persistence:');
  db.init();
  const state = db.getState();
  assert(state !== null && typeof state === 'object', 'Database state initialized as object');
  assert(Array.isArray(state.adultAccounts), 'state.adultAccounts is an array');
  assert(Array.isArray(state.categories), 'state.categories is an array');
  assert(Array.isArray(state.videos), 'state.videos is an array');

  // Test 2: Migrations
  console.log('\n2. Schema Migration Runner:');
  const migrationRes = runMigrations(state);
  assert(state.version >= 2, `Database migration version is v${state.version} (>= 2)`);
  assert(typeof migrationRes.currentVersion === 'number', 'Migration runner reports current version');

  // Test 3: Password Hashing & Verification
  console.log('\n3. Cryptographic Password Security:');
  const plainPassword = 'SuperSafeKidsPass2026!';
  const hashed = hashPassword(plainPassword);
  assert(hashed.includes(':'), 'Hash format includes salt and derived key separator');
  assert(verifyPassword(plainPassword, hashed) === true, 'verifyPassword succeeds with correct password');
  assert(verifyPassword('WrongPassword123!', hashed) === false, 'verifyPassword fails with incorrect password');

  // Test 4: Default Seed Accounts
  console.log('\n4. Seed Accounts & Roles:');
  const admin = db.getAdultAccountByEmail('admin@kinvid.local');
  assert(admin !== undefined && admin.role === 'admin', 'Default Administrator account exists with role=admin');
  const mod = db.getAdultAccountByEmail('moderator@kinvid.local');
  assert(mod !== undefined && mod.role === 'moderator', 'Default Moderator account exists with role=moderator');
  const parent = db.getAdultAccountByEmail('parent@kinvid.local');
  assert(parent !== undefined && parent.role === 'parent', 'Default Parent account exists with role=parent');
  const creator = db.getAdultAccountByEmail('creator@kinvid.local');
  assert(creator !== undefined && creator.role === 'creator', 'Default Creator account exists with role=creator');

  // Test 5: Child Profiles & Parental Linkage
  console.log('\n5. Child Profiles & Parental Ownership:');
  const parentChildren = db.getChildProfiles(parent!.id);
  assert(parentChildren.length === 2, `Parent has 2 registered child profiles (found ${parentChildren.length})`);
  const child1 = parentChildren[0];
  const settings1 = db.getParentalSettings(child1.id);
  assert(settings1 !== undefined, 'Parental settings configured for child profile');
  assert(settings1!.dailyScreenTimeMinutes > 0, `Screen time limit configured (${settings1?.dailyScreenTimeMinutes} mins)`);

  // Test 6: Video Feed Isolation (Pending videos never appear in public feed)
  console.log('\n6. Content Isolation & State Machine:');
  const approvedVideos = db.getVideos({ status: 'APPROVED' });
  const pendingVideos = db.getVideos({ status: 'PENDING_MODERATION' });
  assert(approvedVideos.length >= 5, `Approved video library contains ${approvedVideos.length} videos`);
  assert(pendingVideos.length >= 1, `Pending moderation queue contains ${pendingVideos.length} video`);
  const publicFeedHasPending = approvedVideos.some((v) => v.status !== 'APPROVED');
  assert(!publicFeedHasPending, 'Public approved feed contains ZERO unapproved or pending videos');

  // Test 7: Session Tokens & Tampering Protection
  console.log('\n7. Session Tokens & RBAC:');
  const token = generateToken(admin!);
  const decoded = verifyToken(token);
  assert(decoded !== null && decoded.email === 'admin@kinvid.local', 'Valid token verifies correctly with HMAC signature');
  const tamperedToken = token.slice(0, -4) + 'abcd';
  const tamperedResult = verifyToken(tamperedToken);
  assert(tamperedResult === null, 'Tampered token is rejected immediately');

  // Test 8: Content Reporting
  console.log('\n8. Safety Reporting Ledger:');
  const reports = db.getContentReports();
  assert(reports.length >= 1, `Safety reports queue initialized (${reports.length} report)`);

  console.log('\n======================================================');
  console.log(`  TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
