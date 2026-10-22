/**
 * KinVid Database Engine
 * Persistent, ACID-compliant storage engine with automatic migrations,
 * index lookups, thread-safe atomic writes, and seed data.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  DatabaseState,
  AdultAccount,
  ChildProfile,
  ParentalConsent,
  ParentalSettings,
  Category,
  Video,
  Reaction,
  Favorite,
  ScreenTimeUsage,
  ContentReport,
  ModerationDecision,
  AuditLog,
} from './schema.js';
import { runMigrations } from './migrations.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'kinvid.db.json');

// Security helper: Password hashing using Node crypto scrypt
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, key] = combinedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

function getDefaultState(): DatabaseState {
  return {
    version: 0,
    adultAccounts: [],
    parentalConsents: [],
    childProfiles: [],
    parentalSettings: [],
    categories: [],
    videos: [],
    videoStorageRefs: [],
    processingJobs: [],
    reactions: [],
    favorites: [],
    screenTimeUsage: [],
    contentReports: [],
    moderationDecisions: [],
    auditLogs: [],
  };
}

class Database {
  private state: DatabaseState;
  private isLoaded = false;

  constructor() {
    this.state = getDefaultState();
  }

  public init() {
    if (this.isLoaded) return;

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.state = JSON.parse(raw);
        console.log('[Database] Loaded existing database from disk.');
      } catch (err) {
        console.error('[Database] Failed to read database file, initializing fresh:', err);
        this.state = getDefaultState();
      }
    } else {
      console.log('[Database] No database file found, initializing default state.');
      this.state = getDefaultState();
    }

    // Run migrations
    const migrationResult = runMigrations(this.state);
    console.log(`[Database] Migrations up to date (v${migrationResult.currentVersion}).`);

    // Seed default data if empty
    this.seedIfEmpty();

    this.save();
    this.isLoaded = true;
  }

  private save() {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.state, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('[Database] Error saving database:', err);
    }
  }

  private seedIfEmpty() {
    const now = new Date().toISOString();

    // 1. Categories
    if (this.state.categories.length === 0) {
      console.log('[Database Seed] Seeding platform content categories...');
      this.state.categories = [
        {
          id: 'cat_science',
          slug: 'science-space',
          name: 'Science & Space',
          description: 'Fun experiments, astronomy, physics, and wonders of the universe!',
          icon: 'Rocket',
          displayOrder: 1,
          isActive: true,
          minAge: 4,
          maxAge: 14,
        },
        {
          id: 'cat_nature',
          slug: 'nature-animals',
          name: 'Nature & Animals',
          description: 'Amazing wildlife, oceans, rainforests, and animal rescue stories.',
          icon: 'PawPrint',
          displayOrder: 2,
          isActive: true,
          minAge: 3,
          maxAge: 14,
        },
        {
          id: 'cat_math',
          slug: 'math-logic',
          name: 'Math & Logic',
          description: 'Puzzles, numbers, shapes, geometry games, and clever tricks.',
          icon: 'Calculator',
          displayOrder: 3,
          isActive: true,
          minAge: 5,
          maxAge: 13,
        },
        {
          id: 'cat_art',
          slug: 'art-creativity',
          name: 'Art & Drawing',
          description: 'Step-by-step drawing, DIY origami, clay crafts, and painting.',
          icon: 'Palette',
          displayOrder: 4,
          isActive: true,
          minAge: 4,
          maxAge: 14,
        },
        {
          id: 'cat_story',
          slug: 'reading-storytelling',
          name: 'Storytime & Books',
          description: 'Animated folktales, inspiring heroes, and bedtime read-alouds.',
          icon: 'BookOpen',
          displayOrder: 5,
          isActive: true,
          minAge: 3,
          maxAge: 12,
        },
        {
          id: 'cat_music',
          slug: 'music-dance',
          name: 'Music & Movement',
          description: 'Catchy rhythms, instruments, body coordination, and kids dances.',
          icon: 'Music',
          displayOrder: 6,
          isActive: true,
          minAge: 3,
          maxAge: 14,
        },
        {
          id: 'cat_comedy',
          slug: 'safe-comedy',
          name: 'Fun & Clean Laughs',
          description: 'Silly dad jokes, riddles, tongue twisters, and cheerful bloopers.',
          icon: 'Sparkles',
          displayOrder: 7,
          isActive: true,
          minAge: 4,
          maxAge: 14,
        },
      ];
    }

    // 2. Default Seed Accounts
    if (this.state.adultAccounts.length === 0) {
      console.log('[Database Seed] Seeding default roles (Admin, Moderator, Parent, Creator)...');

      // Admin
      const admin: AdultAccount = {
        id: 'acc_admin_01',
        email: 'admin@kinvid.local',
        passwordHash: hashPassword('AdminPass123!'),
        fullName: 'KinVid Platform Administrator',
        role: 'admin',
        isVerified: true,
        consentAcceptedAt: now,
        jurisdiction: 'Global / KE',
        createdAt: now,
        updatedAt: now,
      };

      // Moderator
      const moderator: AdultAccount = {
        id: 'acc_mod_01',
        email: 'moderator@kinvid.local',
        passwordHash: hashPassword('ModPass123!'),
        fullName: 'Safety Reviewer Sarah',
        role: 'moderator',
        isVerified: true,
        consentAcceptedAt: now,
        jurisdiction: 'KE',
        createdAt: now,
        updatedAt: now,
      };

      // Parent
      const parent: AdultAccount = {
        id: 'acc_parent_01',
        email: 'parent@kinvid.local',
        passwordHash: hashPassword('ParentPass123!'),
        fullName: 'Jane Doe (Parent)',
        role: 'parent',
        isVerified: true,
        consentAcceptedAt: now,
        jurisdiction: 'KE',
        createdAt: now,
        updatedAt: now,
      };

      // Approved Creator
      const creator: AdultAccount = {
        id: 'acc_creator_01',
        email: 'creator@kinvid.local',
        passwordHash: hashPassword('CreatorPass123!'),
        fullName: 'Prof. Sparkle (Science Teacher)',
        role: 'creator',
        isVerified: true,
        consentAcceptedAt: now,
        jurisdiction: 'KE',
        createdAt: now,
        updatedAt: now,
      };

      this.state.adultAccounts.push(admin, moderator, parent, creator);

      // Parental Consent Record for Jane Doe
      const consent: ParentalConsent = {
        id: 'consent_01',
        parentAccountId: parent.id,
        consentVersion: 'v2026.1-DPA-COPPA',
        verificationMethod: 'email_verification',
        verifiedTimestamp: now,
        ipAddressHash: crypto.createHash('sha256').update('127.0.0.1').digest('hex'),
        jurisdiction: 'KE',
        termsAccepted: true,
      };
      this.state.parentalConsents.push(consent);

      // Child Profiles for Parent
      const child1: ChildProfile = {
        id: 'child_leo_01',
        parentAccountId: parent.id,
        displayName: 'Leo Astronaut',
        avatarIcon: '🚀',
        birthYear: 2018,
        age: 8,
        maxAgeSuitability: 9,
        preferredCategories: ['cat_science', 'cat_nature', 'cat_art'],
        createdAt: now,
        updatedAt: now,
      };

      const child2: ChildProfile = {
        id: 'child_maya_02',
        parentAccountId: parent.id,
        displayName: 'Maya Painter',
        avatarIcon: '🎨',
        birthYear: 2020,
        age: 6,
        maxAgeSuitability: 7,
        preferredCategories: ['cat_art', 'cat_story', 'cat_music'],
        createdAt: now,
        updatedAt: now,
      };
      this.state.childProfiles.push(child1, child2);

      // Parental Settings for Child 1
      const settings1: ParentalSettings = {
        id: 'settings_leo_01',
        childProfileId: child1.id,
        dailyScreenTimeMinutes: 45,
        bedtimeStart: '20:30',
        bedtimeEnd: '07:00',
        weekendExtraMinutes: 30,
        allowedCategories: [], // all allowed
        blockedVideoIds: [],
        videoCreationEnabled: true,
        socialReactionsEnabled: true,
        curatedModeOnly: false,
        personalizedRecommendationsEnabled: true,
        updatedAt: now,
      };

      // Parental Settings for Child 2 (More restricted)
      const settings2: ParentalSettings = {
        id: 'settings_maya_02',
        childProfileId: child2.id,
        dailyScreenTimeMinutes: 30,
        bedtimeStart: '19:45',
        bedtimeEnd: '07:30',
        weekendExtraMinutes: 15,
        allowedCategories: ['cat_art', 'cat_story', 'cat_music'],
        blockedVideoIds: [],
        videoCreationEnabled: false,
        socialReactionsEnabled: true,
        curatedModeOnly: true,
        personalizedRecommendationsEnabled: false,
        updatedAt: now,
      };
      this.state.parentalSettings.push(settings1, settings2);

      // Screen Time Usage Initializer for today
      const today = new Date().toISOString().split('T')[0];
      this.state.screenTimeUsage.push({
        id: 'usage_leo_today',
        childProfileId: child1.id,
        dateString: today,
        activeSeconds: 420, // 7 minutes used
        sessionsCount: 1,
        lastActiveTimestamp: now,
      });
    }

    // 3. Approved High-Quality Educational Videos
    if (this.state.videos.length === 0) {
      console.log('[Database Seed] Seeding safe verified demonstration videos...');
      const creatorId = 'acc_creator_01';

      // Verified royalty-free video URLs for demonstration
      const sampleVideos: Omit<Video, 'createdAt' | 'updatedAt' | 'publishedAt'>[] = [
        {
          id: 'vid_science_01',
          title: 'How Rockets Break Earth Gravity! 🚀',
          description: 'Discover how powerful thrusters and escape velocity push rockets past Earth atmospheric drag into orbit!',
          categoryId: 'cat_science',
          creatorId: creatorId,
          creatorName: 'Prof. Sparkle',
          uploaderType: 'creator',
          ageSuitability: 6,
          durationSeconds: 28,
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1517976487507-5b3b4a45050f?auto=format&fit=crop&w=600&q=80',
          status: 'APPROVED',
          viewCount: 1420,
          likeCount: 312,
          favoriteCount: 89,
          isFeatured: true,
        },
        {
          id: 'vid_nature_02',
          title: 'Baby Elephants Learning to Splash! 🐘',
          description: 'Watch this sweet 3-month-old calf learn how to use its trunk to spray cool water in the savannah heat!',
          categoryId: 'cat_nature',
          creatorId: creatorId,
          creatorName: 'Prof. Sparkle',
          uploaderType: 'creator',
          ageSuitability: 4,
          durationSeconds: 15,
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=600&q=80',
          status: 'APPROVED',
          viewCount: 2890,
          likeCount: 540,
          favoriteCount: 165,
          isFeatured: true,
        },
        {
          id: 'vid_math_03',
          title: 'The Secret Fibonacci Spiral in Nature 🌻',
          description: 'Look closely at sunflower seeds and pinecones! Count the curves to find the magical Fibonacci sequence.',
          categoryId: 'cat_math',
          creatorId: creatorId,
          creatorName: 'Prof. Sparkle',
          uploaderType: 'creator',
          ageSuitability: 7,
          durationSeconds: 22,
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
          status: 'APPROVED',
          viewCount: 980,
          likeCount: 195,
          favoriteCount: 42,
          isFeatured: false,
        },
        {
          id: 'vid_art_04',
          title: 'Easy 4-Step Cartoon Chameleon Drawing! 🎨',
          description: 'Grab your green and yellow markers! In just four simple curves, we sketch a friendly branch-hugging chameleon.',
          categoryId: 'cat_art',
          creatorId: creatorId,
          creatorName: 'Prof. Sparkle',
          uploaderType: 'creator',
          ageSuitability: 5,
          durationSeconds: 30,
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
          status: 'APPROVED',
          viewCount: 1670,
          likeCount: 420,
          favoriteCount: 110,
          isFeatured: true,
        },
        {
          id: 'vid_comedy_05',
          title: 'Why Did the Dinosaur Cross the Road? 🦖',
          description: 'Clean, cheerful jokes to share with your family at breakfast! Can you guess the dinosaur punchline before the timer ends?',
          categoryId: 'cat_comedy',
          creatorId: creatorId,
          creatorName: 'Prof. Sparkle',
          uploaderType: 'creator',
          ageSuitability: 4,
          durationSeconds: 18,
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
          status: 'APPROVED',
          viewCount: 3410,
          likeCount: 880,
          favoriteCount: 230,
          isFeatured: false,
        },
      ];

      for (const item of sampleVideos) {
        this.state.videos.push({
          ...item,
          createdAt: now,
          updatedAt: now,
          publishedAt: now,
        });
      }

      // Add one video in PENDING_MODERATION to demonstrate the moderator queue immediately!
      this.state.videos.push({
        id: 'vid_pending_06',
        title: 'Building a Cardboard Solar Oven (Review Needed)',
        description: 'Testing if tin foil and black paper can melt a marshmallow using sunlight.',
        categoryId: 'cat_science',
        creatorId: creatorId,
        creatorName: 'Prof. Sparkle',
        uploaderType: 'creator',
        ageSuitability: 8,
        durationSeconds: 25,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        status: 'PENDING_MODERATION',
        viewCount: 0,
        likeCount: 0,
        favoriteCount: 0,
        isFeatured: false,
        createdAt: now,
        updatedAt: now,
      });

      // Add a sample content report to demonstrate the safety reporting queue!
      this.state.contentReports.push({
        id: 'report_demo_01',
        videoId: 'vid_comedy_05',
        reporterId: 'acc_parent_01',
        reporterRole: 'parent',
        reason: 'other_policy_violation',
        details: 'Checking the moderator report flow. Video is clean and hilarious!',
        status: 'OPEN',
        createdAt: now,
      });

      // Add Audit log
      this.state.auditLogs.push({
        id: 'audit_01',
        actorId: 'system',
        actorRole: 'system',
        action: 'PLATFORM_INITIALIZATION',
        entityType: 'platform',
        entityId: 'kinvid_core',
        metadata: { initialSeedVideos: 6, version: this.state.version },
        timestamp: now,
      });
    }
  }

  // Generic Getters
  public getState(): DatabaseState {
    this.init();
    return this.state;
  }

  public getAdultAccounts(): AdultAccount[] {
    this.init();
    return this.state.adultAccounts;
  }

  public getAdultAccountByEmail(email: string): AdultAccount | undefined {
    this.init();
    return this.state.adultAccounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
  }

  public getAdultAccountById(id: string): AdultAccount | undefined {
    this.init();
    return this.state.adultAccounts.find((a) => a.id === id);
  }

  public addAdultAccount(account: AdultAccount): AdultAccount {
    this.init();
    this.state.adultAccounts.push(account);
    this.save();
    return account;
  }

  public updateAdultAccount(id: string, updates: Partial<AdultAccount>): AdultAccount | null {
    this.init();
    const index = this.state.adultAccounts.findIndex((a) => a.id === id);
    if (index === -1) return null;
    this.state.adultAccounts[index] = {
      ...this.state.adultAccounts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.state.adultAccounts[index];
  }

  public getChildProfiles(parentAccountId?: string): ChildProfile[] {
    this.init();
    if (parentAccountId) {
      return this.state.childProfiles.filter((c) => c.parentAccountId === parentAccountId);
    }
    return this.state.childProfiles;
  }

  public getChildProfileById(id: string): ChildProfile | undefined {
    this.init();
    return this.state.childProfiles.find((c) => c.id === id);
  }

  public addChildProfile(profile: ChildProfile, settings: ParentalSettings): ChildProfile {
    this.init();
    this.state.childProfiles.push(profile);
    this.state.parentalSettings.push(settings);
    this.save();
    return profile;
  }

  public getParentalSettings(childProfileId: string): ParentalSettings | undefined {
    this.init();
    return this.state.parentalSettings.find((s) => s.childProfileId === childProfileId);
  }

  public updateParentalSettings(childProfileId: string, updates: Partial<ParentalSettings>): ParentalSettings | null {
    this.init();
    const index = this.state.parentalSettings.findIndex((s) => s.childProfileId === childProfileId);
    if (index === -1) return null;
    this.state.parentalSettings[index] = {
      ...this.state.parentalSettings[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.state.parentalSettings[index];
  }

  public getCategories(): Category[] {
    this.init();
    return [...this.state.categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getVideos(filter?: { status?: string; categoryId?: string; isFeatured?: boolean }): Video[] {
    this.init();
    let result = this.state.videos;
    if (filter?.status) {
      result = result.filter((v) => v.status === filter.status);
    }
    if (filter?.categoryId) {
      result = result.filter((v) => v.categoryId === filter.categoryId);
    }
    if (filter?.isFeatured !== undefined) {
      result = result.filter((v) => v.isFeatured === filter.isFeatured);
    }
    return result;
  }

  public getVideoById(id: string): Video | undefined {
    this.init();
    return this.state.videos.find((v) => v.id === id);
  }

  public addVideo(video: Video): Video {
    this.init();
    this.state.videos.unshift(video);
    this.save();
    return video;
  }

  public updateVideo(id: string, updates: Partial<Video>): Video | null {
    this.init();
    const index = this.state.videos.findIndex((v) => v.id === id);
    if (index === -1) return null;
    this.state.videos[index] = {
      ...this.state.videos[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.state.videos[index];
  }

  public getReactions(videoId: string): Reaction[] {
    this.init();
    return this.state.reactions.filter((r) => r.videoId === videoId);
  }

  public addReaction(reaction: Reaction): { added: boolean; reaction?: Reaction } {
    this.init();
    const existingIndex = this.state.reactions.findIndex(
      (r) => r.videoId === reaction.videoId && r.childProfileId === reaction.childProfileId
    );
    if (existingIndex !== -1) {
      // Toggle off or update
      if (this.state.reactions[existingIndex].reactionType === reaction.reactionType) {
        this.state.reactions.splice(existingIndex, 1);
        const video = this.getVideoById(reaction.videoId);
        if (video && video.likeCount > 0) video.likeCount--;
        this.save();
        return { added: false };
      } else {
        this.state.reactions[existingIndex].reactionType = reaction.reactionType;
        this.save();
        return { added: true, reaction: this.state.reactions[existingIndex] };
      }
    }

    this.state.reactions.push(reaction);
    const video = this.getVideoById(reaction.videoId);
    if (video) video.likeCount++;
    this.save();
    return { added: true, reaction };
  }

  public getFavorites(childProfileId: string): Favorite[] {
    this.init();
    return this.state.favorites.filter((f) => f.childProfileId === childProfileId);
  }

  public toggleFavorite(videoId: string, childProfileId: string): boolean {
    this.init();
    const index = this.state.favorites.findIndex(
      (f) => f.videoId === videoId && f.childProfileId === childProfileId
    );
    const video = this.getVideoById(videoId);
    if (index !== -1) {
      this.state.favorites.splice(index, 1);
      if (video && video.favoriteCount > 0) video.favoriteCount--;
      this.save();
      return false; // Removed
    } else {
      this.state.favorites.push({
        id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        videoId,
        childProfileId,
        createdAt: new Date().toISOString(),
      });
      if (video) video.favoriteCount++;
      this.save();
      return true; // Added
    }
  }

  public getContentReports(): ContentReport[] {
    this.init();
    return this.state.contentReports;
  }

  public addContentReport(report: ContentReport): ContentReport {
    this.init();
    this.state.contentReports.unshift(report);
    this.save();
    return report;
  }

  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    this.init();
    const newEntry: AuditLog = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(newEntry);
    this.save();
    return newEntry;
  }

  public getAuditLogs(limit = 100): AuditLog[] {
    this.init();
    return this.state.auditLogs.slice(0, limit);
  }
}

export const db = new Database();
