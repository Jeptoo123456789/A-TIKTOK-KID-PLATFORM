/**
 * KinVid Authentication & Authorization Middleware
 * Server-side RBAC enforcement, session validation, and child ownership checks.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { AdultAccount, UserRole } from '../db/schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'kinvid_dev_secure_session_secret_change_in_production_2026';
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface AuthSessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  exp: number;
}

// Extend Express Request
export interface AuthenticatedRequest extends Request {
  user?: AdultAccount;
  session?: AuthSessionPayload;
}

export function generateToken(account: AdultAccount): string {
  const payload: AuthSessionPayload = {
    userId: account.id,
    email: account.email,
    role: account.role,
    fullName: account.fullName,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): AuthSessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(encodedPayload)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8')) as AuthSessionPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Optional authentication middleware - populates req.user if a valid Bearer token is passed.
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  const session = verifyToken(token);
  if (!session) {
    return next();
  }

  const user = db.getAdultAccountById(session.userId);
  if (user) {
    req.user = user;
    req.session = session;
  }
  next();
}

/**
 * Mandatory authentication middleware - rejects request with 401 if not authenticated.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication token required. Please sign in.',
    });
  }

  const token = authHeader.substring(7).trim();
  const session = verifyToken(token);
  if (!session) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Session has expired or is invalid. Please sign in again.',
    });
  }

  const user = db.getAdultAccountById(session.userId);
  if (!user) {
    return res.status(401).json({
      error: 'USER_NOT_FOUND',
      message: 'Account not found or has been revoked.',
    });
  }

  req.user = user;
  req.session = session;
  next();
}

/**
 * Role-Based Access Control middleware.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Access denied. Requires one of [${allowedRoles.join(', ')}] role. Current role is '${req.user.role}'.`,
      });
    }

    next();
  };
}

/**
 * Verifies that the authenticated parent owns the requested child profile.
 */
export function verifyChildOwnership(childIdParam = 'childId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const childId = req.params[childIdParam] || req.body?.childProfileId || req.query?.childId;
    if (!childId) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Child profile ID is missing' });
    }

    // Admins have override privileges for auditing/support
    if (req.user.role === 'admin') {
      return next();
    }

    const child = db.getChildProfileById(String(childId));
    if (!child) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Child profile not found' });
    }

    if (child.parentAccountId !== req.user.id) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Access denied: You do not have parental ownership over this child profile.',
      });
    }

    next();
  };
}
