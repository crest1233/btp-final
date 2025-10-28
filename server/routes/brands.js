const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole, requireOwnership } = require('../middleware/auth');
const { validate, createBrandSchema, updateBrandSchema } = require('../validation/schemas');

const router = express.Router();
const prisma = new PrismaClient();

// Get all brands (public, with filtering)
router.get('/', async (req, res) => {
  try {
    const {
      search,
      industry,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      ...(search && {
        OR: [
          { companyName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(industry && {
        industry: { contains: industry, mode: 'insensitive' }
      })
    };

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          companyName: true,
          description: true,
          logo: true,
          website: true,
          industry: true,
          createdAt: true,
          _count: {
            select: {
              campaigns: true
            }
          }
        }
      }),
      prisma.brand.count({ where })
    ]);

    res.json({
      brands,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// Get brand by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { email: true, createdAt: true }
        },
        campaigns: {
          select: {
            id: true,
            title: true,
            status: true,
            budget: true,
            startDate: true,
            endDate: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json({ brand });
  } catch (error) {
    console.error('Get brand error:', error);
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
});

// Create brand profile (requires BRAND role)
router.post('/', 
  authenticateToken, 
  requireRole(['BRAND']), 
  validate(createBrandSchema), 
  async (req, res) => {
    try {
      // Check if brand profile already exists
      const existingBrand = await prisma.brand.findUnique({
        where: { userId: req.user.id }
      });

      if (existingBrand) {
        return res.status(400).json({ error: 'Brand profile already exists' });
      }

      const brand = await prisma.brand.create({
        data: {
          ...req.body,
          userId: req.user.id
        }
      });

      res.status(201).json({
        message: 'Brand profile created successfully',
        brand
      });
    } catch (error) {
      console.error('Create brand error:', error);
      res.status(500).json({ error: 'Failed to create brand profile' });
    }
  }
);

// Update brand profile (requires ownership or admin)
router.put('/:id',
  authenticateToken,
  requireOwnership(async (req) => {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id }
    });
    return brand?.userId;
  }),
  validate(updateBrandSchema),
  async (req, res) => {
    try {
      const brand = await prisma.brand.update({
        where: { id: req.params.id },
        data: req.body
      });

      res.json({
        message: 'Brand profile updated successfully',
        brand
      });
    } catch (error) {
      console.error('Update brand error:', error);
      res.status(500).json({ error: 'Failed to update brand profile' });
    }
  }
);

// Delete brand profile (requires ownership or admin)
router.delete('/:id',
  authenticateToken,
  requireOwnership(async (req) => {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id }
    });
    return brand?.userId;
  }),
  async (req, res) => {
    try {
      await prisma.brand.delete({
        where: { id: req.params.id }
      });

      res.json({ message: 'Brand profile deleted successfully' });
    } catch (error) {
      console.error('Delete brand error:', error);
      res.status(500).json({ error: 'Failed to delete brand profile' });
    }
  }
);

// Get brand statistics (requires ownership or admin)
router.get('/:id/stats',
  authenticateToken,
  requireOwnership(async (req) => {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id }
    });
    return brand?.userId;
  }),
  async (req, res) => {
    try {
      const brandId = req.params.id;

      const [
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        totalApplications,
        approvedApplications,
        totalBudget,
        spentBudget
      ] = await Promise.all([
        prisma.campaign.count({
          where: { brandId }
        }),
        prisma.campaign.count({
          where: { brandId, status: 'ACTIVE' }
        }),
        prisma.campaign.count({
          where: { brandId, status: 'COMPLETED' }
        }),
        prisma.campaignApplication.count({
          where: { campaign: { brandId } }
        }),
        prisma.campaignApplication.count({
          where: { campaign: { brandId }, status: 'APPROVED' }
        }),
        prisma.campaign.aggregate({
          where: { brandId },
          _sum: { budget: true }
        }),
        prisma.campaign.aggregate({
          where: { brandId, status: { in: ['COMPLETED', 'ACTIVE'] } },
          _sum: { budget: true }
        })
      ]);

      const stats = {
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        draftCampaigns: totalCampaigns - activeCampaigns - completedCampaigns,
        totalApplications,
        approvedApplications,
        pendingApplications: totalApplications - approvedApplications,
        totalBudget: totalBudget._sum.budget || 0,
        spentBudget: spentBudget._sum.budget || 0,
        availableBudget: (totalBudget._sum.budget || 0) - (spentBudget._sum.budget || 0)
      };

      res.json({ stats });
    } catch (error) {
      console.error('Get brand stats error:', error);
      res.status(500).json({ error: 'Failed to fetch brand statistics' });
    }
  }
);

// Get brand dashboard data (requires ownership or admin)
router.get('/:id/dashboard',
  authenticateToken,
  requireOwnership(async (req) => {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id }
    });
    return brand?.userId;
  }),
  async (req, res) => {
    try {
      const brandId = req.params.id;

      const [
        recentCampaigns,
        recentApplications,
        stats
      ] = await Promise.all([
        // Recent campaigns
        prisma.campaign.findMany({
          where: { brandId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            _count: {
              select: {
                applications: true
              }
            }
          }
        }),
        // Recent applications
        prisma.campaignApplication.findMany({
          where: { campaign: { brandId } },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                instagramFollowers: true,
                avgEngagementRate: true
              }
            },
            campaign: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }),
        // Stats (reuse the stats endpoint logic)
        (async () => {
          const [
            totalCampaigns,
            activeCampaigns,
            totalApplications,
            totalBudget
          ] = await Promise.all([
            prisma.campaign.count({ where: { brandId } }),
            prisma.campaign.count({ where: { brandId, status: 'ACTIVE' } }),
            prisma.campaignApplication.count({ where: { campaign: { brandId } } }),
            prisma.campaign.aggregate({
              where: { brandId },
              _sum: { budget: true }
            })
          ]);

          return {
            totalCampaigns,
            activeCampaigns,
            totalApplications,
            totalBudget: totalBudget._sum.budget || 0
          };
        })()
      ]);

      res.json({
        recentCampaigns,
        recentApplications,
        stats
      });
    } catch (error) {
      console.error('Get brand dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch brand dashboard data' });
    }
  }
);

module.exports = router;