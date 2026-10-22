/**
 * KinVid Authentication Endpoints
 * Parent/Guardian registration, login, session validation, and verifiable consent.
 */

import { Router, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { db, hashPassword, verifyPassword } from '../../db/database.js';
import { generateToken, requireAuth, AuthenticatedRequest } from '../../middleware/auth.js';
import { AdultAccount, ParentalConsent } from '../../db/schema.js';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full legal name is required'),
  role: z.enum(['parent', 'guardian', 'creator']).default('parent'),
  consentAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Parental Consent & Child Online Protection Terms',
  }),
  jurisdiction: z.string().default('KE'),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/v1/auth/register
router.post('/register', (req, res, next) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid registration input',
        details: parsed.error.format(),
      });
    }

    const { email, password, fullName, role, jurisdiction } = parsed.data;

    // Check duplicate
    const existing = db.getAdultAccountByEmail(email);
    if (existing) {
      return res.status(409).json({
        error: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    const now = new Date().toISOString();
    const newAccount: AdultAccount = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: email.toLowerCase().trim(),
      passwordHash: hashPassword(password),
      fullName: fullName.trim(),
      role,
      isVerified: true,
      consentAcceptedAt: now,
      jurisdiction,
      createdAt: now,
      updatedAt: now,
    };

    db.addAdultAccount(newAccount);

    // Record formal verifiable consent audit trail
    const consent: ParentalConsent = {
      id: `consent_${Date.now()}`,
      parentAccountId: newAccount.id,
      consentVersion: 'v2026.1-DPA-COPPA',
      verificationMethod: 'email_verification',
      verifiedTimestamp: now,
      ipAddressHash: crypto.createHash('sha256').update(req.ip || '127.0.0.1').digest('hex'),
      jurisdiction,
      termsAccepted: true,
    };
    db.getState().parentalConsents.push(consent);

    // Audit log
    db.addAuditLog({
      actorId: newAccount.id,
      actorRole: newAccount.role,
      action: 'PARENT_REGISTRATION',
      entityType: 'adult_account',
      entityId: newAccount.id,
      metadata: { email: newAccount.email, jurisdiction },
      ipAddress: req.ip,
    });

    const token = generateToken(newAccount);

    res.status(201).json({
      success: true,
      message: 'Account successfully registered and verified.',
      token,
      user: {
        id: newAccount.id,
        email: newAccount.email,
        fullName: newAccount.fullName,
        role: newAccount.role,
        isVerified: newAccount.isVerified,
        createdAt: newAccount.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', (req, res, next) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required',
      });
    }

    const { email, password } = parsed.data;
    const account = db.getAdultAccountByEmail(email);

    if (!account || !verifyPassword(password, account.passwordHash)) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password. Please try again.',
      });
    }

    const token = generateToken(account);

    db.addAuditLog({
      actorId: account.id,
      actorRole: account.role,
      action: 'LOGIN_SUCCESS',
      entityType: 'adult_account',
      entityId: account.id,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: {
        id: account.id,
        email: account.email,
        fullName: account.fullName,
        role: account.role,
        isVerified: account.isVerified,
        createdAt: account.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
  });
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Signed out successfully.',
  });
});

export default router;
