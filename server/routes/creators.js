const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole, requireOwnership } = require('../middleware/auth');
const { validate, createCreatorSchema, updateCreatorSchema, createEventSchema, updateEventSchema } = require('../validation/schemas');
const bcrypt = require('bcryptjs');

const router = express.Router();
const prisma = new PrismaClient();

// Get all creators (public, with filtering and search)
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      minFollowers,
      maxFollowers,
      minEngagement,
      maxEngagement,
      location,
      ageGroup,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const categoryLower = category ? String(category).toLowerCase() : undefined;

    // Build where clause
    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { displayName: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { bio: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(categoryLower && {
        categories: { has: categoryLower }
      }),
      ...(location && {
        location: { contains: location, mode: 'insensitive' }
      }),
      ...(minFollowers && {
        OR: [
          { instagramFollowers: { gte: parseInt(minFollowers) } },
          { tiktokFollowers: { gte: parseInt(minFollowers) } },
          { youtubeFollowers: { gte: parseInt(minFollowers) } }
        ]
      }),
      ...(maxFollowers && {
        AND: [
          { instagramFollowers: { lte: parseInt(maxFollowers) } },
          { tiktokFollowers: { lte: parseInt(maxFollowers) } },
          { youtubeFollowers: { lte: parseInt(maxFollowers) } }
        ]
      }),
      ...(minEngagement && {
        avgEngagementRate: { gte: parseFloat(minEngagement) }
      }),
      ...(maxEngagement && {
        avgEngagementRate: { lte: parseFloat(maxEngagement) }
      }),
      ...(ageGroup && {
        age: getAgeRange(ageGroup)
      })
    };

    // Build orderBy clause
    const orderBy = {};
    if (sortBy === 'followers') {
      orderBy.instagramFollowers = sortOrder;
    } else if (sortBy === 'engagement') {
      orderBy.avgEngagementRate = sortOrder;
    } else if (sortBy === 'price') {
      orderBy.basePrice = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [creators, total] = await Promise.all([
      prisma.creator.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatar: true,
          instagramHandle: true,
          instagramFollowers: true,
          tiktokHandle: true,
          tiktokFollowers: true,
          youtubeHandle: true,
          youtubeFollowers: true,
          avgEngagementRate: true,
          basePrice: true,
          age: true,
          location: true,
          categories: true,
          isVerified: true,
          createdAt: true
        }
      }),
      prisma.creator.count({ where })
    ]);

    res.json({
      creators,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get creators error:', error);
    res.status(500).json({ error: 'Failed to fetch creators' });
  }
});

// Get creator by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const creator = await prisma.creator.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { email: true, createdAt: true }
        }
      }
    });

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    res.json({ creator });
  } catch (error) {
    console.error('Get creator error:', error);
    res.status(500).json({ error: 'Failed to fetch creator' });
  }
});

// Create creator profile (requires CREATOR role)
router.post('/', 
  authenticateToken, 
  requireRole(['CREATOR']), 
  validate(createCreatorSchema), 
  async (req, res) => {
    try {
      // Check if creator profile already exists
      const existingCreator = await prisma.creator.findUnique({
        where: { userId: req.user.id }
      });

      if (existingCreator) {
        return res.status(400).json({ error: 'Creator profile already exists' });
      }

      // Check if username is taken
      const existingUsername = await prisma.creator.findUnique({
        where: { username: req.body.username }
      });

      if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      const data = { ...req.body };
      if (data.categories) data.categories = normalizeCategories(data.categories);

      const creator = await prisma.creator.create({
        data: {
          ...data,
          userId: req.user.id
        }
      });

      res.status(201).json({
        message: 'Creator profile created successfully',
        creator
      });
    } catch (error) {
      console.error('Create creator error:', error);
      res.status(500).json({ error: 'Failed to create creator profile' });
    }
  }
);

// Update creator profile (requires ownership or admin)
router.put('/:id',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({
      where: { id: req.params.id }
    });
    return creator?.userId;
  }),
  validate(updateCreatorSchema),
  async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.categories) data.categories = normalizeCategories(data.categories);

      const creator = await prisma.creator.update({
        where: { id: req.params.id },
        data
      });

      res.json({
        message: 'Creator profile updated successfully',
        creator
      });
    } catch (error) {
      console.error('Update creator error:', error);
      res.status(500).json({ error: 'Failed to update creator profile' });
    }
  }
);

// Delete creator profile (requires ownership or admin)
router.delete('/:id',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({
      where: { id: req.params.id }
    });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      await prisma.creator.delete({
        where: { id: req.params.id }
      });

      res.json({ message: 'Creator profile deleted successfully' });
    } catch (error) {
      console.error('Delete creator error:', error);
      res.status(500).json({ error: 'Failed to delete creator profile' });
    }
  }
);

// Get creator statistics (requires ownership or admin)
router.get('/:id/stats',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({
      where: { id: req.params.id }
    });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const creatorId = req.params.id;

      const [
        totalApplications,
        approvedApplications,
        pendingApplications,
        shortlistCount
      ] = await Promise.all([
        prisma.campaignApplication.count({
          where: { creatorId }
        }),
        prisma.campaignApplication.count({
          where: { creatorId, status: 'APPROVED' }
        }),
        prisma.campaignApplication.count({
          where: { creatorId, status: 'PENDING' }
        }),
        prisma.shortlist.count({
          where: { creatorId }
        })
      ]);

      const stats = {
        totalApplications,
        approvedApplications,
        pendingApplications,
        rejectedApplications: totalApplications - approvedApplications - pendingApplications,
        shortlistCount,
        approvalRate: totalApplications > 0 ? (approvedApplications / totalApplications * 100).toFixed(1) : 0
      };

      res.json({ stats });
    } catch (error) {
      console.error('Get creator stats error:', error);
      res.status(500).json({ error: 'Failed to fetch creator statistics' });
    }
  }
);

// Helper function to convert age group to age range
function getAgeRange(ageGroup) {
  switch (ageGroup) {
    case '18-24':
      return { gte: 18, lte: 24 };
    case '25-34':
      return { gte: 25, lte: 34 };
    case '35-44':
      return { gte: 35, lte: 44 };
    case '45+':
      return { gte: 45 };
    default:
      return undefined;
  }
}

// Get creator applications (requires ownership)
router.get('/:id/applications',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.id } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);
      
      const where = {
        creatorId: id,
        ...(status && { status })
      };
      
      const [applications, total] = await Promise.all([
        prisma.campaignApplication.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            campaign: {
              include: {
                brand: true
              }
            }
          }
        }),
        prisma.campaignApplication.count({ where })
      ]);
      
      res.json({
        items: applications,
        page: parseInt(page),
        limit: parseInt(limit),
        total
      });
    } catch (error) {
      console.error('Error fetching creator applications:', error);
      res.status(500).json({ error: 'Failed to fetch creator applications' });
    }
  }
);

module.exports = router;
// Creator Events: list events (requires ownership or admin)
router.get('/:id/events',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.id } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const events = await prisma.event.findMany({
        where: { creatorId: req.params.id },
        orderBy: { startAt: 'asc' }
      });
      res.json({ events });
    } catch (error) {
      console.error('List events error:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  }
);

// Creator Events: create event (requires ownership or admin)
router.post('/:id/events',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.id } });
    return creator?.userId;
  }),
  validate(createEventSchema),
  async (req, res) => {
    try {
      const event = await prisma.event.create({
        data: {
          creatorId: req.params.id,
          title: req.body.title,
          description: req.body.description,
          startAt: new Date(req.body.startAt),
          endAt: req.body.endAt ? new Date(req.body.endAt) : null,
          location: req.body.location
        }
      });
      res.status(201).json({ message: 'Event created', event });
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  }
);

// Creator Events: get single event (requires ownership or admin)
router.get('/:creatorId/events/:eventId',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.creatorId } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const event = await prisma.event.findUnique({ where: { id: req.params.eventId } });
      if (!event || event.creatorId !== req.params.creatorId) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json({ event });
    } catch (error) {
      console.error('Get event error:', error);
      res.status(500).json({ error: 'Failed to fetch event' });
    }
  }
);

// Creator Events: update event (requires ownership or admin)
router.put('/:creatorId/events/:eventId',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.creatorId } });
    return creator?.userId;
  }),
  validate(updateEventSchema),
  async (req, res) => {
    try {
      const existing = await prisma.event.findUnique({ where: { id: req.params.eventId } });
      if (!existing || existing.creatorId !== req.params.creatorId) {
        return res.status(404).json({ error: 'Event not found' });
      }
      const event = await prisma.event.update({
        where: { id: req.params.eventId },
        data: {
          title: req.body.title ?? existing.title,
          description: req.body.description ?? existing.description,
          startAt: req.body.startAt ? new Date(req.body.startAt) : existing.startAt,
          endAt: req.body.endAt ? new Date(req.body.endAt) : existing.endAt,
          location: req.body.location ?? existing.location
        }
      });
      res.json({ message: 'Event updated', event });
    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  }
);

// Helper: normalize categories to array of strings
function normalizeCategories(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((x) => String(x).trim().toLowerCase()).filter(Boolean);
  return String(val)
    .split(/[;,|]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 20);
}

// Helper: normalize incoming influencer entry keys to our Creator fields
function normalizeEntry(raw) {
  const get = (candidates) => {
    for (const k of candidates) {
      if (raw[k] !== undefined && raw[k] !== null && String(raw[k]).length > 0) return raw[k];
    }
    return undefined;
  };
  const name = get(['displayName', 'name', 'fullName']);
  const username = get(['username', 'handle', 'instagramHandle', 'instagram_handle', 'ig', 'instagram']);
  const email = (get(['email', 'mail']) || '').toString().trim().toLowerCase();
  const instagramHandle = get(['instagramHandle', 'instagram_handle', 'instagram', 'ig', 'handle']);
  const instagramFollowers = get(['instagramFollowers', 'instagram_followers', 'followers', 'ig_followers']);
  const tiktokHandle = get(['tiktokHandle', 'tiktok_handle', 'tiktok']);
  const tiktokFollowers = get(['tiktokFollowers', 'tiktok_followers']);
  const youtubeHandle = get(['youtubeHandle', 'youtube_handle', 'youtube', 'yt']);
  const youtubeFollowers = get(['youtubeFollowers', 'youtube_followers']);
  const avgEngagementRate = get(['avgEngagementRate', 'engagementRate', 'engagement_rate']);
  const basePrice = get(['basePrice', 'rate', 'price']);
  const age = get(['age']);
  const gender = get(['gender']);
  const location = get(['location', 'city']);
  const categories = normalizeCategories(get(['categories', 'category', 'niche', 'tags']));
  const bio = get(['bio', 'about']);
  const isVerified = !!get(['isVerified', 'verified']);

  return {
    displayName: name,
    username,
    email,
    instagramHandle: instagramHandle ? String(instagramHandle).replace(/^@/, '') : undefined,
    instagramFollowers: instagramFollowers !== undefined ? Number(instagramFollowers) : undefined,
    tiktokHandle,
    tiktokFollowers: tiktokFollowers !== undefined ? Number(tiktokFollowers) : undefined,
    youtubeHandle,
    youtubeFollowers: youtubeFollowers !== undefined ? Number(youtubeFollowers) : undefined,
    avgEngagementRate: avgEngagementRate !== undefined ? Number(avgEngagementRate) : undefined,
    basePrice: basePrice !== undefined ? Number(basePrice) : undefined,
    age: age !== undefined ? Number(age) : undefined,
    gender: gender || undefined,
    location: location || undefined,
    categories,
    bio,
    isVerified
  };
}

// Bulk import creators (admin only)
router.post('/import',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const { items } = req.body || {};
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Provide an array `items` with influencer entries' });
      }

      const results = [];
      for (const raw of items) {
        const norm = normalizeEntry(raw);

        // derive username
        let username = norm.username;
        if (!username) {
          if (norm.displayName) {
            username = String(norm.displayName).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 30);
          }
        }
        if (!username) username = `creator_${Math.random().toString(36).slice(2, 10)}`;

        // derive email
        let email = norm.email;
        if (!email) email = `${username}@import.local`;

        // find or create user
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          const password = raw.password || `Imported#${Math.random().toString(36).slice(2, 10)}`;
          const hashed = await bcrypt.hash(password, 12);
          user = await prisma.user.create({ data: { email, password: hashed, role: 'CREATOR' } });
        }

        const creatorData = {
          userId: user.id,
          username,
          displayName: norm.displayName || username,
          bio: norm.bio || null,
          instagramHandle: norm.instagramHandle || null,
          instagramFollowers: norm.instagramFollowers ?? null,
          tiktokHandle: norm.tiktokHandle || null,
          tiktokFollowers: norm.tiktokFollowers ?? null,
          youtubeHandle: norm.youtubeHandle || null,
          youtubeFollowers: norm.youtubeFollowers ?? null,
          avgEngagementRate: norm.avgEngagementRate ?? null,
          basePrice: norm.basePrice ?? null,
          age: norm.age ?? null,
          gender: norm.gender || null,
          location: norm.location || null,
          categories: norm.categories || [],
          isVerified: norm.isVerified,
          isActive: true
        };

        // upsert by username (unique)
        const creator = await prisma.creator.upsert({
          where: { username },
          create: creatorData,
          update: {
            displayName: creatorData.displayName,
            bio: creatorData.bio,
            instagramHandle: creatorData.instagramHandle,
            instagramFollowers: creatorData.instagramFollowers,
            tiktokHandle: creatorData.tiktokHandle,
            tiktokFollowers: creatorData.tiktokFollowers,
            youtubeHandle: creatorData.youtubeHandle,
            youtubeFollowers: creatorData.youtubeFollowers,
            avgEngagementRate: creatorData.avgEngagementRate,
            basePrice: creatorData.basePrice,
            age: creatorData.age,
            gender: creatorData.gender,
            location: creatorData.location,
            categories: creatorData.categories,
            isVerified: creatorData.isVerified,
            isActive: true
          }
        });

        results.push({ id: creator.id, username: creator.username, email });
      }

      res.json({ imported: results.length, creators: results });
    } catch (error) {
      console.error('Bulk import creators error:', error);
      res.status(500).json({ error: 'Failed to import creators' });
    }
  }
);

// Creator Deals
router.get('/:id/deals',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.id } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const deals = await prisma.deal.findMany({
        where: { creatorId: req.params.id },
        orderBy: { updatedAt: 'desc' },
      });
      res.json({ items: deals });
    } catch (error) {
      console.error('List deals error:', error);
      res.status(500).json({ error: 'Failed to fetch deals' });
    }
  }
);

router.post('/:id/deals',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.id } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const { title, brand, value, status, notes } = req.body || {};
      const normalizedStatus = (() => {
        const k = String(status || '').toLowerCase();
        if (k === 'paid' || k === 'completed') return 'COMPLETED';
        if (k === 'pending' || k === 'active') return 'ACTIVE';
        if (k === 'negotiating') return 'NEGOTIATING';
        if (k === 'lost') return 'LOST';
        return 'NEW';
      })();
      if (!title) return res.status(400).json({ error: 'Title is required' });
      const deal = await prisma.deal.create({
        data: {
          creatorId: req.params.id,
          title,
          brand: brand || null,
          value: value != null ? Number(value) : null,
          status: normalizedStatus,
          notes: notes || null,
        },
      });
      res.status(201).json({ message: 'Deal created', deal });
    } catch (error) {
      console.error('Create deal error:', error);
      res.status(500).json({ error: 'Failed to create deal' });
    }
  }
);

router.put('/:creatorId/deals/:dealId',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.creatorId } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const { title, brand, value, status, notes } = req.body || {};
      const normalizedStatus = status ? (() => {
        const k = String(status || '').toLowerCase();
        if (k === 'paid' || k === 'completed') return 'COMPLETED';
        if (k === 'pending' || k === 'active') return 'ACTIVE';
        if (k === 'negotiating') return 'NEGOTIATING';
        if (k === 'lost') return 'LOST';
        return 'NEW';
      })() : undefined;
      const deal = await prisma.deal.update({
        where: { id: req.params.dealId },
        data: {
          title: title || undefined,
          brand: brand || undefined,
          value: value != null ? Number(value) : undefined,
          status: normalizedStatus,
          notes: notes || undefined,
        },
      });
      res.json({ message: 'Deal updated', deal });
    } catch (error) {
      console.error('Update deal error:', error);
      res.status(500).json({ error: 'Failed to update deal' });
    }
  }
);

router.delete('/:creatorId/deals/:dealId',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.creatorId } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      await prisma.deal.delete({ where: { id: req.params.dealId } });
      res.json({ message: 'Deal deleted' });
    } catch (error) {
      console.error('Delete deal error:', error);
      res.status(500).json({ error: 'Failed to delete deal' });
    }
  }
);

// Creator Invoices
router.get('/:id/invoices',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.id } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const invoices = await prisma.invoice.findMany({
        where: { creatorId: req.params.id },
        include: { items: true, deal: true },
        orderBy: { issueDate: 'desc' },
      });
      res.json({ items: invoices });
    } catch (error) {
      console.error('List invoices error:', error);
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  }
);

router.post('/:id/invoices',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.id } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const { invoiceNumber, issueDate, dueDate, status, currency, subtotal, tax, total, notes, dealId, items, clientName, clientEmail, clientCompany, clientAddress, clientCity, clientState, clientZip, clientCountry, clientTaxId, paymentTerms } = req.body || {};
      const normalizedStatus = (() => {
        const k = String(status || '').toLowerCase();
        if (k === 'sent') return 'SENT';
        if (k === 'paid') return 'PAID';
        if (k === 'overdue') return 'OVERDUE';
        return 'DRAFT';
      })();
      if (!invoiceNumber || !issueDate) return res.status(400).json({ error: 'invoiceNumber and issueDate are required' });
      const invoice = await prisma.invoice.create({
        data: {
          creatorId: req.params.id,
          dealId: dealId || null,
          invoiceNumber,
          issueDate: new Date(issueDate),
          dueDate: dueDate ? new Date(dueDate) : null,
          status: normalizedStatus,
          clientName: clientName || null,
          clientEmail: clientEmail || null,
          clientCompany: clientCompany || null,
          clientAddress: clientAddress || null,
          clientCity: clientCity || null,
          clientState: clientState || null,
          clientZip: clientZip || null,
          clientCountry: clientCountry || null,
          clientTaxId: clientTaxId || null,
          paymentTerms: paymentTerms || null,
          currency: currency || 'USD',
          subtotal: subtotal != null ? Number(subtotal) : null,
          tax: tax != null ? Number(tax) : null,
          total: total != null ? Number(total) : null,
          notes: notes || null,
          items: items && Array.isArray(items) ? {
            create: items.map((it) => ({
              description: it.description,
              quantity: Number(it.quantity || 1),
              unitPrice: Number(it.unitPrice || 0),
              total: Number(it.total || (Number(it.quantity || 1) * Number(it.unitPrice || 0))),
            }))
          } : undefined,
        },
        include: { items: true },
      });
      res.status(201).json({ message: 'Invoice created', invoice });
    } catch (error) {
      console.error('Create invoice error:', error);
      res.status(500).json({ error: 'Failed to create invoice' });
    }
  }
);

router.put('/:creatorId/invoices/:invoiceId',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.creatorId } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const { status, currency, subtotal, tax, total, notes, clientName, clientEmail, clientCompany, clientAddress, clientCity, clientState, clientZip, clientCountry, clientTaxId, paymentTerms } = req.body || {};
      const normalizedStatus = status ? (() => {
        const k = String(status || '').toLowerCase();
        if (k === 'sent') return 'SENT';
        if (k === 'paid') return 'PAID';
        if (k === 'overdue') return 'OVERDUE';
        return 'DRAFT';
      })() : undefined;
      const invoice = await prisma.invoice.update({
        where: { id: req.params.invoiceId },
        data: {
          status: normalizedStatus,
          currency: currency || undefined,
          subtotal: subtotal != null ? Number(subtotal) : undefined,
          tax: tax != null ? Number(tax) : undefined,
          total: total != null ? Number(total) : undefined,
          notes: notes || undefined,
          clientName: clientName || undefined,
          clientEmail: clientEmail || undefined,
          clientCompany: clientCompany || undefined,
          clientAddress: clientAddress || undefined,
          clientCity: clientCity || undefined,
          clientState: clientState || undefined,
          clientZip: clientZip || undefined,
          clientCountry: clientCountry || undefined,
          clientTaxId: clientTaxId || undefined,
          paymentTerms: paymentTerms || undefined,
        },
        include: { items: true },
      });
      res.json({ message: 'Invoice updated', invoice });
    } catch (error) {
      console.error('Update invoice error:', error);
      res.status(500).json({ error: 'Failed to update invoice' });
    }
  }
);

router.delete('/:creatorId/invoices/:invoiceId',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.creatorId } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      await prisma.invoice.delete({ where: { id: req.params.invoiceId } });
      res.json({ message: 'Invoice deleted' });
    } catch (error) {
      console.error('Delete invoice error:', error);
      res.status(500).json({ error: 'Failed to delete invoice' });
    }
  }
);

// Creator Ideas
router.get('/:id/ideas',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.id } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const ideas = await prisma.idea.findMany({
        where: { creatorId: req.params.id },
        orderBy: { updatedAt: 'desc' },
      });
      res.json({ items: ideas });
    } catch (error) {
      console.error('List ideas error:', error);
      res.status(500).json({ error: 'Failed to fetch ideas' });
    }
  }
);

router.post('/:id/ideas',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.id } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const { title, description, tags, status, priority, attachments } = req.body || {};
      const normalizedStatus = (() => {
        const k = String(status || '').toLowerCase();
        if (k === 'planned') return 'PLANNED';
        if (k === 'published') return 'PUBLISHED';
        if (k === 'archived') return 'ARCHIVED';
        return 'DRAFT';
      })();
      const normalizedPriority = (() => {
        const p = String(priority || '').toLowerCase();
        if (p === 'low') return 'LOW';
        if (p === 'high') return 'HIGH';
        return 'MEDIUM';
      })();
      if (!title) return res.status(400).json({ error: 'Title is required' });
      const idea = await prisma.idea.create({
        data: {
          creatorId: req.params.id,
          title,
          description: description || null,
          tags: Array.isArray(tags) ? tags : [],
          status: normalizedStatus,
          priority: normalizedPriority,
          attachments: Array.isArray(attachments) ? attachments : [],
        },
      });
      res.status(201).json({ message: 'Idea created', idea });
    } catch (error) {
      console.error('Create idea error:', error);
      res.status(500).json({ error: 'Failed to create idea' });
    }
  }
);

router.put('/:creatorId/ideas/:ideaId',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.creatorId } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const { title, description, tags, status, priority, attachments } = req.body || {};
      const normalizedStatus = status ? (() => {
        const k = String(status || '').toLowerCase();
        if (k === 'planned') return 'PLANNED';
        if (k === 'published') return 'PUBLISHED';
        if (k === 'archived') return 'ARCHIVED';
        if (k === 'draft') return 'DRAFT';
        return undefined;
      })() : undefined;
      const normalizedPriority = priority ? (() => {
        const p = String(priority || '').toLowerCase();
        if (p === 'low') return 'LOW';
        if (p === 'high') return 'HIGH';
        if (p === 'medium') return 'MEDIUM';
        return undefined;
      })() : undefined;
      const idea = await prisma.idea.update({
        where: { id: req.params.ideaId },
        data: {
          title: title || undefined,
          description: description || undefined,
          tags: Array.isArray(tags) ? tags : undefined,
          status: normalizedStatus,
          priority: normalizedPriority,
          attachments: Array.isArray(attachments) ? attachments : undefined,
        },
      });
      res.json({ message: 'Idea updated', idea });
    } catch (error) {
      console.error('Update idea error:', error);
      res.status(500).json({ error: 'Failed to update idea' });
    }
  }
);

router.delete('/:creatorId/ideas/:ideaId',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.creatorId } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      await prisma.idea.delete({ where: { id: req.params.ideaId } });
      res.json({ message: 'Idea deleted' });
    } catch (error) {
      console.error('Delete idea error:', error);
      res.status(500).json({ error: 'Failed to delete idea' });
    }
  }
);

// Creator Analytics
router.get('/:id/analytics',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.id } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const { platform } = req.query;
      const where = { creatorId: req.params.id };
      if (platform) where.platform = platform;
      const snapshots = await prisma.analyticsSnapshot.findMany({
        where,
        orderBy: { date: 'desc' },
        take: 100,
      });
      res.json({ items: snapshots });
    } catch (error) {
      console.error('List analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }
);

router.post('/:id/analytics',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.id } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const { platform, date, followers, engagementRate, reach, impressions } = req.body || {};
      if (!platform) return res.status(400).json({ error: 'platform is required' });
      const item = await prisma.analyticsSnapshot.create({
        data: {
          creatorId: req.params.id,
          platform,
          date: date ? new Date(date) : undefined,
          followers: followers != null ? Number(followers) : null,
          engagementRate: engagementRate != null ? Number(engagementRate) : null,
          reach: reach != null ? Number(reach) : null,
          impressions: impressions != null ? Number(impressions) : null,
        },
      });
      res.status(201).json({ message: 'Analytics snapshot created', item });
    } catch (error) {
      console.error('Create analytics error:', error);
      res.status(500).json({ error: 'Failed to create analytics snapshot' });
    }
  }
);

// Creator Media Kit
router.get('/:id/mediakit',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.id } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const mk = await prisma.mediaKit.findUnique({ where: { creatorId: req.params.id } });
      res.json({ item: mk });
    } catch (error) {
      console.error('Get media kit error:', error);
      res.status(500).json({ error: 'Failed to get media kit' });
    }
  }
);

router.put('/:id/mediakit',
  authenticateToken,
  requireOwnership(async (req) => {
    const creator = await prisma.creator.findUnique({ where: { id: req.params.id } });
    return creator?.userId;
  }),
  async (req, res) => {
    try {
      const data = req.body?.data ?? req.body;
      const existing = await prisma.mediaKit.findUnique({ where: { creatorId: req.params.id } });
      const mk = existing
        ? await prisma.mediaKit.update({ where: { creatorId: req.params.id }, data: { data } })
        : await prisma.mediaKit.create({ data: { creatorId: req.params.id, data } });
      res.json({ message: 'Media kit saved', item: mk });
    } catch (error) {
      console.error('Save media kit error:', error);
      res.status(500).json({ error: 'Failed to save media kit' });
    }
  }
);