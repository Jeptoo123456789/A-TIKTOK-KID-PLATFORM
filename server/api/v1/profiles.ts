/**
 * KinVid Child Profiles API
 * Child profile management, parental ownership verification, and settings.
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/database.js';
import { requireAuth, verifyChildOwnership, AuthenticatedRequest } from '../../middleware/auth.js';
import { ChildProfile, ParentalSettings } from '../../db/schema.js';

const router = Router();

const CreateProfileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(30),
  avatarIcon: z.string().default('🚀'),
  age: z.number().int().min(2).max(16),
  maxAgeSuitability: z.number().int().min(2).max(16).optional(),
  preferredCategories: z.array(z.string()).default([]),
  dailyScreenTimeMinutes: z.number().int().min(5).max(300).default(60),
  bedtimeStart: z.string().default('20:00'),
  bedtimeEnd: z.string().default('07:00'),
  videoCreationEnabled: z.boolean().default(false),
  socialReactionsEnabled: z.boolean().default(true),
});

// GET /api/v1/profiles - List profiles for current parent
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const profiles = db.getChildProfiles(req.user!.id);
  const profilesWithSettings = profiles.map((p) => {
    const settings = db.getParentalSettings(p.id);
    return {
      ...p,
      settings,
    };
  });

  res.status(200).json({
    success: true,
    count: profilesWithSettings.length,
    profiles: profilesWithSettings,
  });
});

// GET /api/v1/profiles/:childId - Get single profile
router.get('/:childId', requireAuth, verifyChildOwnership('childId'), (req: AuthenticatedRequest, res: Response) => {
  const { childId } = req.params;
  const profile = db.getChildProfileById(childId);
  const settings = db.getParentalSettings(childId);

  res.status(200).json({
    success: true,
    profile,
    settings,
  });
});

// POST /api/v1/profiles - Create new child profile
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const parsed = CreateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid profile details',
      details: parsed.error.format(),
    });
  }

  const {
    displayName,
    avatarIcon,
    age,
    maxAgeSuitability,
    preferredCategories,
    dailyScreenTimeMinutes,
    bedtimeStart,
    bedtimeEnd,
    videoCreationEnabled,
    socialReactionsEnabled,
  } = parsed.data;

  const now = new Date().toISOString();
  const currentYear = new Date().getFullYear();
  const childId = `child_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newProfile: ChildProfile = {
    id: childId,
    parentAccountId: req.user!.id,
    displayName: displayName.trim(),
    avatarIcon: avatarIcon || '🚀',
    birthYear: currentYear - age,
    age,
    maxAgeSuitability: maxAgeSuitability || age + 1,
    preferredCategories,
    createdAt: now,
    updatedAt: now,
  };

  const newSettings: ParentalSettings = {
    id: `settings_${childId}`,
    childProfileId: childId,
    dailyScreenTimeMinutes,
    bedtimeStart,
    bedtimeEnd,
    weekendExtraMinutes: 30,
    allowedCategories: [],
    blockedVideoIds: [],
    videoCreationEnabled,
    socialReactionsEnabled,
    curatedModeOnly: false,
    personalizedRecommendationsEnabled: true,
    updatedAt: now,
  };

  db.addChildProfile(newProfile, newSettings);

  db.addAuditLog({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    action: 'CREATE_CHILD_PROFILE',
    entityType: 'child_profile',
    entityId: childId,
    metadata: { displayName: newProfile.displayName, age: newProfile.age },
  });

  res.status(201).json({
    success: true,
    profile: newProfile,
    settings: newSettings,
  });
});

export default router;
