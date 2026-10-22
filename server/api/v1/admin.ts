/**
 * KinVid Administration & Platform Management API
 * Provides live operational metrics, audit logging, and platform-wide monitoring.
 */

import { Router, Response } from 'express';
import { db } from '../../db/database.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth.js';

const router = Router();

// GET /api/v1/admin/stats
router.get('/stats', requireAuth, requireRole('admin', 'moderator'), (req: AuthenticatedRequest, res: Response) => {
  const state = db.getState();

  const approvedVideos = state.videos.filter((v) => v.status === 'APPROVED').length;
  const pendingModeration = state.videos.filter((v) => v.status === 'PENDING_MODERATION').length;
  const pendingParentApproval = state.videos.filter((v) => v.status === 'PENDING_PARENT_APPROVAL').length;
  const rejectedVideos = state.videos.filter((v) => v.status === 'REJECTED').length;
  const openReports = state.contentReports.filter((r) => r.status === 'OPEN').length;

  const stats = {
    accounts: {
      total: state.adultAccounts.length,
      parents: state.adultAccounts.filter((a) => a.role === 'parent').length,
      creators: state.adultAccounts.filter((a) => a.role === 'creator').length,
      moderators: state.adultAccounts.filter((a) => a.role === 'moderator').length,
      admins: state.adultAccounts.filter((a) => a.role === 'admin').length,
    },
    children: {
      totalProfiles: state.childProfiles.length,
    },
    videos: {
      total: state.videos.length,
      approved: approvedVideos,
      pendingModeration,
      pendingParentApproval,
      rejected: rejectedVideos,
    },
    safety: {
      totalReports: state.contentReports.length,
      openReports,
      resolvedReports: state.contentReports.filter((r) => r.status === 'RESOLVED').length,
    },
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      databaseVersion: state.version,
    },
  };

  res.status(200).json({
    success: true,
    stats,
  });
});

// GET /api/v1/admin/audit-logs (Admin only)
router.get('/audit-logs', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const limit = Math.min(200, parseInt((req.query.limit as string) || '50', 10));
  const logs = db.getAuditLogs(limit);

  res.status(200).json({
    success: true,
    count: logs.length,
    logs,
  });
});

export default router;
