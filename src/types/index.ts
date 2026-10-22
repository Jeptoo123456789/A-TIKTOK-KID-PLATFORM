export type UserRole = 'parent' | 'guardian' | 'moderator' | 'admin' | 'creator';

export interface AdultAccount {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
}

export interface ChildProfile {
  id: string;
  parentAccountId: string;
  displayName: string;
  avatarIcon: string;
  age: number;
  maxAgeSuitability: number;
  preferredCategories: string[];
  settings?: ParentalSettings;
  createdAt: string;
}

export interface ParentalSettings {
  id: string;
  childProfileId: string;
  dailyScreenTimeMinutes: number;
  bedtimeStart: string;
  bedtimeEnd: string;
  weekendExtraMinutes: number;
  allowedCategories: string[];
  blockedVideoIds: string[];
  videoCreationEnabled: boolean;
  socialReactionsEnabled: boolean;
  curatedModeOnly: boolean;
  personalizedRecommendationsEnabled: boolean;
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

export interface Video {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  creatorId: string;
  creatorName: string;
  uploaderType: 'creator' | 'child';
  ageSuitability: number;
  durationSeconds: number;
  videoUrl: string;
  thumbnailUrl: string;
  status: 'DRAFT' | 'UPLOADED' | 'PROCESSING' | 'PENDING_PARENT_APPROVAL' | 'PENDING_MODERATION' | 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'REMOVED';
  viewCount: number;
  likeCount: number;
  favoriteCount: number;
  isFeatured: boolean;
  createdAt: string;
  publishedAt?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  database: {
    status: string;
    engine: string;
    schemaVersion: number;
    stats: {
      accounts: number;
      childProfiles: number;
      approvedVideos: number;
      pendingModeration: number;
      categories: number;
      contentReports: number;
    };
  };
  services: {
    authentication: string;
    roleAuthorization: string;
    videoStreaming: string;
    parentalControls: string;
    contentModeration: string;
  };
  environment: {
    nodeEnv: string;
    nodeVersion: string;
    port: number | string;
    memoryHeapUsedMB: number;
  };
}
