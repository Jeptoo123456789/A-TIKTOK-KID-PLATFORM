/**
 * KinVid Videos API
 * Video feed with age and parental restriction enforcement, reactions, favorites, and detail retrieval.
 */

import { Router, Request, Response } from 'express';
import { db } from '../../db/database.js';
import { optionalAuth, AuthenticatedRequest } from '../../middleware/auth.js';
import { ReactionType } from '../../db/schema.js';

const router = Router();

// GET /api/v1/videos/feed
router.get('/feed', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const childProfileId = req.query.childProfileId as string | undefined;
  const categoryId = req.query.categoryId as string | undefined;
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
  const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) || '10', 10)));

  let allowedCategories: string[] | null = null;
  let blockedVideoIds: string[] = [];
  let maxAgeSuitability = 14;

  if (childProfileId) {
    const profile = db.getChildProfileById(childProfileId);
    if (profile) {
      maxAgeSuitability = profile.maxAgeSuitability || 14;
      const settings = db.getParentalSettings(childProfileId);
      if (settings) {
        if (settings.allowedCategories && settings.allowedCategories.length > 0) {
          allowedCategories = settings.allowedCategories;
        }
        if (settings.blockedVideoIds) {
          blockedVideoIds = settings.blockedVideoIds;
        }
      }
    }
  }

  // Filter approved videos only!
  let videos = db.getVideos({ status: 'APPROVED' });

  // Exclude blocked videos
  if (blockedVideoIds.length > 0) {
    videos = videos.filter((v) => !blockedVideoIds.includes(v.id));
  }

  // Category filter
  if (categoryId) {
    videos = videos.filter((v) => v.categoryId === categoryId);
  } else if (allowedCategories) {
    videos = videos.filter((v) => allowedCategories!.includes(v.categoryId));
  }

  // Age suitability filter
  videos = videos.filter((v) => v.ageSuitability <= maxAgeSuitability);

  const total = videos.length;
  const startIndex = (page - 1) * limit;
  const paginated = videos.slice(startIndex, startIndex + limit);

  res.status(200).json({
    success: true,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    videos: paginated,
  });
});

// GET /api/v1/videos/:id
router.get('/:id', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const video = db.getVideoById(id);

  if (!video) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Video not found.' });
  }

  // Unapproved video access restriction
  if (video.status !== 'APPROVED') {
    const user = req.user;
    const isAuthorizedStaff = user && (user.role === 'admin' || user.role === 'moderator');
    const isOwnerCreator = user && user.id === video.creatorId;

    if (!isAuthorizedStaff && !isOwnerCreator) {
      return res.status(403).json({
        error: 'ACCESS_RESTRICTED',
        message: 'This video is pending review or is not published.',
      });
    }
  }

  res.status(200).json({
    success: true,
    video,
  });
});

// POST /api/v1/videos/:id/react
router.post('/:id/react', (req: Request, res: Response) => {
  const { id } = req.params;
  const { childProfileId, reactionType } = req.body;

  if (!childProfileId || !reactionType) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'childProfileId and reactionType are required.',
    });
  }

  // Check parent social permissions
  const settings = db.getParentalSettings(childProfileId);
  if (settings && !settings.socialReactionsEnabled) {
    return res.status(403).json({
      error: 'PARENTAL_CONTROL_RESTRICTION',
      message: 'Reactions have been disabled by your parent for this profile.',
    });
  }

  const video = db.getVideoById(id);
  if (!video) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Video not found.' });
  }

  const result = db.addReaction({
    id: `react_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    videoId: id,
    childProfileId,
    reactionType: reactionType as ReactionType,
    createdAt: new Date().toISOString(),
  });

  res.status(200).json({
    success: true,
    added: result.added,
    likeCount: video.likeCount,
  });
});

// POST /api/v1/videos/:id/favorite
router.post('/:id/favorite', (req: Request, res: Response) => {
  const { id } = req.params;
  const { childProfileId } = req.body;

  if (!childProfileId) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'childProfileId is required.',
    });
  }

  const video = db.getVideoById(id);
  if (!video) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Video not found.' });
  }

  const isFavorited = db.toggleFavorite(id, childProfileId);

  res.status(200).json({
    success: true,
    isFavorited,
    favoriteCount: video.favoriteCount,
  });
});

export default router;
