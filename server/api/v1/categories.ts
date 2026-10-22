/**
 * KinVid Category Endpoints
 * Manages educational and safe content categories.
 */

import { Router, Request, Response } from 'express';
import { db } from '../../db/database.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../middleware/auth.js';
import { Category } from '../../db/schema.js';

const router = Router();

// GET /api/v1/categories
router.get('/', (req: Request, res: Response) => {
  const categories = db.getCategories().filter((c) => c.isActive);
  res.status(200).json({
    success: true,
    count: categories.length,
    categories,
  });
});

// POST /api/v1/categories (Admin only)
router.post('/', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { name, slug, description, icon, displayOrder, minAge, maxAge } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Name and slug are required.' });
  }

  const newCategory: Category = {
    id: `cat_${Date.now()}`,
    slug: slug.toLowerCase().trim(),
    name: name.trim(),
    description: description || '',
    icon: icon || 'Sparkles',
    displayOrder: typeof displayOrder === 'number' ? displayOrder : 99,
    isActive: true,
    minAge: minAge || 3,
    maxAge: maxAge || 14,
  };

  db.getState().categories.push(newCategory);

  db.addAuditLog({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    action: 'CREATE_CATEGORY',
    entityType: 'category',
    entityId: newCategory.id,
    metadata: { name: newCategory.name, slug: newCategory.slug },
  });

  res.status(201).json({
    success: true,
    category: newCategory,
  });
});

export default router;
