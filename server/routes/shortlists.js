const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate, schemas } = require('../validation/schemas');

// Brand: list shortlist
router.get('/', authenticateToken, requireRole('BRAND'), async (req, res, next) => {
  try {
    const brand = await prisma.brand.findUnique({ where: { userId: req.user.id } });
    if (!brand) return res.status(403).json({ message: 'Brand profile not found' });

    const items = await prisma.shortlist.findMany({
      where: { brandId: brand.id },
      include: { creator: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

// Brand: add creator to shortlist
router.post('/', authenticateToken, requireRole('BRAND'), validate(schemas.createShortlistSchema), async (req, res, next) => {
  try {
    const brand = await prisma.brand.findUnique({ where: { userId: req.user.id } });
    if (!brand) return res.status(403).json({ message: 'Brand profile not found' });

    const { creatorId, notes } = req.body;
    const entry = await prisma.shortlist.create({
      data: { brandId: brand.id, creatorId, notes },
      include: { creator: true },
    });
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

// Brand: remove from shortlist
router.delete('/:id', authenticateToken, requireRole('BRAND'), async (req, res, next) => {
  try {
    const brand = await prisma.brand.findUnique({ where: { userId: req.user.id } });
    if (!brand) return res.status(403).json({ message: 'Brand profile not found' });

    const entry = await prisma.shortlist.findUnique({ where: { id: req.params.id } });
    if (!entry || entry.brandId !== brand.id) return res.status(403).json({ message: 'Not authorized' });

    await prisma.shortlist.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;