const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate, schemas } = require('../validation/schemas');

// Admin: list users with pagination and optional role filter
router.get('/', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, role } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where = role ? { role } : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          creator: true,
          brand: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ items, page: Number(page), pageSize: Number(pageSize), total });
  } catch (err) {
    next(err);
  }
});

// Admin: get a single user
router.get('/:id', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        creator: true,
        brand: true,
      },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Admin: update user role
router.put('/:id/role', authenticateToken, requireRole('ADMIN'), validate(schemas.updateUserRole), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const updated = await prisma.user.update({ where: { id }, data: { role } });
    res.json({ id: updated.id, role: updated.role });
  } catch (err) {
    next(err);
  }
});

// Admin: delete user (cascades via relations)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;