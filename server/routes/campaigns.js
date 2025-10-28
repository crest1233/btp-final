const express = require('express');
const router = express.Router();
const { PrismaClient, ApplicationStatus } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, requireRole, requireOwnership } = require('../middleware/auth');
const { validate, schemas } = require('../validation/schemas');

// Public: list campaigns with filters and pagination
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, status, brandId, search } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where = {
      ...(status ? { status } : {}),
      ...(brandId ? { brandId } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: { brand: true },
      }),
      prisma.campaign.count({ where }),
    ]);

    res.json({ items, page: Number(page), pageSize: Number(pageSize), total });
  } catch (err) {
    next(err);
  }
});

// Public: campaign by id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        brand: true,
        applications: { include: { creator: true } },
      },
    });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    next(err);
  }
});

// Brand: create campaign
router.post('/', authenticateToken, requireRole('BRAND'), validate(schemas.createCampaignSchema), async (req, res, next) => {
  try {
    const brand = await prisma.brand.findUnique({ where: { userId: req.user.id } });
    if (!brand) return res.status(403).json({ message: 'Brand profile not found' });

    const data = { ...req.body, brandId: brand.id };
    const created = await prisma.campaign.create({ data });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Brand: invite/shortlist a creator to a specific campaign
router.post('/:id/invite', authenticateToken, requireRole('BRAND'), validate(schemas.createCampaignInviteSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { creatorId, proposedPrice, message, portfolio } = req.body;

    const brand = await prisma.brand.findUnique({ where: { userId: req.user.id } });
    if (!brand) return res.status(403).json({ message: 'Brand profile not found' });

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign || campaign.brandId !== brand.id) return res.status(403).json({ message: 'Not authorized' });

    // If application already exists, update it to APPROVED
    const existing = await prisma.campaignApplication.findUnique({
      where: { campaignId_creatorId: { campaignId: id, creatorId } }
    });

    if (existing) {
      const updated = await prisma.campaignApplication.update({
        where: { id: existing.id },
        data: {
          status: ApplicationStatus.APPROVED,
          proposedPrice: typeof proposedPrice === 'number' ? proposedPrice : existing.proposedPrice,
          message: typeof message === 'string' ? message : existing.message,
          portfolio: Array.isArray(portfolio) ? portfolio : existing.portfolio,
        },
        include: { campaign: true, creator: true }
      });
      return res.json(updated);
    }

    const app = await prisma.campaignApplication.create({
      data: {
        campaignId: id,
        creatorId,
        status: ApplicationStatus.APPROVED,
        proposedPrice,
        message,
        portfolio,
      },
      include: { campaign: true, creator: true }
    });

    res.status(201).json(app);
  } catch (err) {
    next(err);
  }
});

// Brand: update campaign they own
router.put('/:id', authenticateToken, requireRole('BRAND'), validate(schemas.updateCampaignSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const brand = await prisma.brand.findUnique({ where: { userId: req.user.id } });
    if (!brand) return res.status(403).json({ message: 'Brand profile not found' });

    const owned = await prisma.campaign.findUnique({ where: { id } });
    if (!owned || owned.brandId !== brand.id) return res.status(403).json({ message: 'Not authorized to update this campaign' });

    const updated = await prisma.campaign.update({ where: { id }, data: req.body });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Brand: delete campaign they own
router.delete('/:id', authenticateToken, requireRole('BRAND'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const brand = await prisma.brand.findUnique({ where: { userId: req.user.id } });
    if (!brand) return res.status(403).json({ message: 'Brand profile not found' });

    const owned = await prisma.campaign.findUnique({ where: { id } });
    if (!owned || owned.brandId !== brand.id) return res.status(403).json({ message: 'Not authorized to delete this campaign' });

    await prisma.campaign.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Creator: list campaigns related to creator (by application APPROVED)
router.get('/creator/:creatorId', authenticateToken, requireRole('CREATOR'), async (req, res, next) => {
  try {
    const { creatorId } = req.params;
    const creator = await prisma.creator.findUnique({ where: { userId: req.user.id } });
    if (!creator || creator.id !== creatorId) return res.status(403).json({ message: 'Not authorized' });

    const approvedApps = await prisma.campaignApplication.findMany({
      where: { creatorId, status: ApplicationStatus.APPROVED },
      include: { campaign: true },
      orderBy: { createdAt: 'desc' },
    });

    const campaigns = approvedApps.map(a => a.campaign);
    res.json({ items: campaigns });
  } catch (err) {
    next(err);
  }
});

// Creator: apply to a campaign
router.post('/:id/applications', authenticateToken, requireRole('CREATOR'), validate(schemas.createApplicationSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const creator = await prisma.creator.findUnique({ where: { userId: req.user.id } });
    if (!creator) return res.status(403).json({ message: 'Creator profile not found' });

    const app = await prisma.campaignApplication.create({
      data: {
        campaignId: id,
        creatorId: creator.id,
        ...req.body,
      },
    });
    res.status(201).json(app);
  } catch (err) {
    next(err);
  }
});

// Brand: manage application status
router.put('/:campaignId/applications/:applicationId', authenticateToken, requireRole('BRAND'), validate(schemas.updateApplicationSchema), async (req, res, next) => {
  try {
    const { campaignId, applicationId } = req.params;
    const brand = await prisma.brand.findUnique({ where: { userId: req.user.id } });
    if (!brand) return res.status(403).json({ message: 'Brand profile not found' });

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.brandId !== brand.id) return res.status(403).json({ message: 'Not authorized' });

    const updated = await prisma.campaignApplication.update({
      where: { id: applicationId },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Creator: respond to application (accept/decline)
router.put('/applications/:applicationId/respond', authenticateToken, requireRole('CREATOR'), async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { response } = req.body; // 'ACCEPTED' or 'DECLINED'
    
    const creator = await prisma.creator.findUnique({ where: { userId: req.user.id } });
    if (!creator) return res.status(403).json({ message: 'Creator profile not found' });

    // Verify the application belongs to this creator
    const application = await prisma.campaignApplication.findUnique({
      where: { id: applicationId },
      include: { campaign: true }
    });
    
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.creatorId !== creator.id) return res.status(403).json({ message: 'Not authorized to respond to this application' });
    
    // Only allow response if application is APPROVED by brand
    if (application.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Can only respond to approved applications' });
    }

    // Update application with creator response
    const updated = await prisma.campaignApplication.update({
      where: { id: applicationId },
      data: { 
        creatorResponse: response,
        respondedAt: new Date()
      },
      include: { campaign: true, creator: true }
    });
    
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;