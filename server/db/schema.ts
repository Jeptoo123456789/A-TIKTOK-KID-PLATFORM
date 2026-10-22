/**
 * KinVid Platform Schema Definitions
 * Child-Friendly Short Video Social Platform
 *
 * Implements all 18 core normalized entities required by the platform specification.
 */

export type UserRole = 'parent' | 'guardian' | 'moderator' | 'admin' | 'creator';

export interface AdultAccount {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isVerified: boolean;
  consentAcceptedAt: string | null;
  phoneNumber?: string;
  jurisdiction?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParentalConsent {
  id: string;
  parentAccountId: string;
  consentVersion: string;
  verificationMethod: 'email_verification' | 'id_verification' | 'payment_token';
  verifiedTimestamp: string;
  ipAddressHash: string;
  jurisdiction: string;
  termsAccepted: boolean;
}

export interface ChildProfile {
  id: string;
  parentAccountId: string;
  displayName: string;
  avatarIcon: string;
  birthYear: number;
  age: number;
  maxAgeSuitability: number;
  pinCodeHash?: string;
  preferredCategories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ParentalSettings {
  id: string;
  childProfileId: string;
  dailyScreenTimeMinutes: number; // e.g. 60
  bedtimeStart: string; // "20:00"
  bedtimeEnd: string; // "07:00"
  weekendExtraMinutes: number;
  allowedCategories: string[]; // empty means all allowed
  blockedVideoIds: string[];
  videoCreationEnabled: boolean;
  socialReactionsEnabled: boolean;
  curatedModeOnly: boolean;
  personalizedRecommendationsEnabled: boolean;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  minAge: number;
  maxAge: number;
}

export type VideoStatus =
  | 'DRAFT'
  | 'UPLOADED'
  | 'PROCESSING'
  | 'PENDING_PARENT_APPROVAL'
  | 'PENDING_MODERATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'BLOCKED'
  | 'REMOVED'
  | 'PROCESSING_FAILED';

export interface Video {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  creatorId: string;
  creatorName: string;
  uploaderType: 'creator' | 'child';
  childProfileId?: string;
  ageSuitability: number; // e.g., 3, 6, 9, 12
  durationSeconds: number;
  videoUrl: string;
  thumbnailUrl: string;
  captionsUrl?: string;
  status: VideoStatus;
  rejectionReason?: string;
  moderationNotes?: string;
  viewCount: number;
  likeCount: number;
  favoriteCount: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface VideoStorageRef {
  id: string;
  videoId: string;
  storageDriver: 'local' | 's3';
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  checksumSha256: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface ProcessingJob {
  id: string;
  videoId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  step: 'VALIDATING' | 'TRANSCODING' | 'THUMBNAIL_GENERATION' | 'CONTENT_SCREENING' | 'DONE';
  progressPercentage: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export type ReactionType = 'like' | 'sparkle' | 'laugh' | 'star' | 'clap';

export interface Reaction {
  id: string;
  videoId: string;
  childProfileId: string;
  reactionType: ReactionType;
  createdAt: string;
}

export interface Favorite {
  id: string;
  videoId: string;
  childProfileId: string;
  createdAt: string;
}

export interface ScreenTimeUsage {
  id: string;
  childProfileId: string;
  dateString: string; // YYYY-MM-DD
  activeSeconds: number;
  sessionsCount: number;
  lastActiveTimestamp: string;
}

export type ReportReason =
  | 'inappropriate_content'
  | 'harassment_bullying'
  | 'dangerous_challenges'
  | 'impersonation'
  | 'privacy_violation'
  | 'suspected_exploitation_abuse'
  | 'other_policy_violation';

export interface ContentReport {
  id: string;
  videoId: string;
  reporterId: string;
  reporterRole: UserRole | 'child';
  childProfileId?: string;
  reason: ReportReason;
  details: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolutionNotes?: string;
  resolvedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ModerationDecision {
  id: string;
  videoId: string;
  moderatorId: string;
  action: 'APPROVE' | 'REJECT' | 'ESCALATE' | 'TAKEDOWN';
  reason?: string;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

export interface DatabaseState {
  version: number;
  adultAccounts: AdultAccount[];
  parentalConsents: ParentalConsent[];
  childProfiles: ChildProfile[];
  parentalSettings: ParentalSettings[];
  categories: Category[];
  videos: Video[];
  videoStorageRefs: VideoStorageRef[];
  processingJobs: ProcessingJob[];
  reactions: Reaction[];
  favorites: Favorite[];
  screenTimeUsage: ScreenTimeUsage[];
  contentReports: ContentReport[];
  moderationDecisions: ModerationDecision[];
  auditLogs: AuditLog[];
}
