const Joi = require('joi');

// Auth schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('CREATOR', 'BRAND', 'ADMIN').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Creator schemas
const createCreatorSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  displayName: Joi.string().min(1).max(100).required(),
  bio: Joi.string().max(500).optional(),
  instagramHandle: Joi.string().max(50).optional(),
  tiktokHandle: Joi.string().max(50).optional(),
  youtubeHandle: Joi.string().max(50).optional(),
  age: Joi.number().integer().min(13).max(100).optional(),
  location: Joi.string().max(100).optional(),
  gender: Joi.string().max(20).optional(),
  categories: Joi.array().items(Joi.string()).optional(),
  basePrice: Joi.number().min(0).optional()
});

const updateCreatorSchema = Joi.object({
  displayName: Joi.string().min(1).max(100).optional(),
  bio: Joi.string().max(500).optional(),
  instagramHandle: Joi.string().max(50).optional(),
  instagramFollowers: Joi.number().integer().min(0).optional(),
  tiktokHandle: Joi.string().max(50).optional(),
  tiktokFollowers: Joi.number().integer().min(0).optional(),
  youtubeHandle: Joi.string().max(50).optional(),
  youtubeFollowers: Joi.number().integer().min(0).optional(),
  avgEngagementRate: Joi.number().min(0).max(100).optional(),
  age: Joi.number().integer().min(13).max(100).optional(),
  location: Joi.string().max(100).optional(),
  gender: Joi.string().max(20).optional(),
  categories: Joi.array().items(Joi.string()).optional(),
  basePrice: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional()
});

// Brand schemas
const createBrandSchema = Joi.object({
  companyName: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(1000).optional(),
  website: Joi.string().uri().optional(),
  industry: Joi.string().max(50).optional(),
  contactEmail: Joi.string().email().optional(),
  contactPhone: Joi.string().max(20).optional()
});

const updateBrandSchema = Joi.object({
  companyName: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(1000).optional(),
  website: Joi.string().uri().optional(),
  industry: Joi.string().max(50).optional(),
  contactEmail: Joi.string().email().optional(),
  contactPhone: Joi.string().max(20).optional()
});

// Campaign schemas
const createCampaignSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(1).max(2000).required(),
  budget: Joi.number().min(0).required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
  deliverables: Joi.array().items(Joi.string()).min(1).required(),
  requirements: Joi.array().items(Joi.string()).optional(),
  targetAudience: Joi.string().max(500).optional(),
  preferredCategories: Joi.array().items(Joi.string()).optional(),
  minFollowers: Joi.number().integer().min(0).optional(),
  maxFollowers: Joi.number().integer().min(Joi.ref('minFollowers')).optional()
});

const updateCampaignSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().min(1).max(2000).optional(),
  budget: Joi.number().min(0).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  deliverables: Joi.array().items(Joi.string()).optional(),
  requirements: Joi.array().items(Joi.string()).optional(),
  targetAudience: Joi.string().max(500).optional(),
  preferredCategories: Joi.array().items(Joi.string()).optional(),
  minFollowers: Joi.number().integer().min(0).optional(),
  maxFollowers: Joi.number().integer().optional(),
  status: Joi.string().valid('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED').optional()
});

// Campaign Application schemas
const createApplicationSchema = Joi.object({
  campaignId: Joi.string().required(),
  proposedPrice: Joi.number().min(0).optional(),
  message: Joi.string().max(1000).optional(),
  portfolio: Joi.array().items(Joi.string().uri()).optional()
});

const updateApplicationSchema = Joi.object({
  proposedPrice: Joi.number().min(0).optional(),
  message: Joi.string().max(1000).optional(),
  portfolio: Joi.array().items(Joi.string().uri()).optional(),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').optional()
});

// New: Campaign invite schema (brand shortlists/invites a creator to a campaign)
const createCampaignInviteSchema = Joi.object({
  creatorId: Joi.string().required(),
  proposedPrice: Joi.number().min(0).optional(),
  message: Joi.string().max(1000).optional(),
  portfolio: Joi.array().items(Joi.string().uri()).optional()
});

// Shortlist schemas
const createShortlistSchema = Joi.object({
  creatorId: Joi.string().required(),
  notes: Joi.string().max(500).optional()
});

// Event schemas
const createEventSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000).optional(),
  startAt: Joi.date().iso().required(),
  endAt: Joi.date().iso().greater(Joi.ref('startAt')).optional(),
  location: Joi.string().max(200).optional()
});

const updateEventSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(2000).optional(),
  startAt: Joi.date().iso().optional(),
  endAt: Joi.date().iso().optional(),
  location: Joi.string().max(200).optional()
});

// Admin: update user role schema
const updateUserRole = Joi.object({
  role: Joi.string().valid('CREATOR', 'BRAND', 'ADMIN').required()
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }
    next();
  };
};

const schemas = {
  registerSchema,
  loginSchema,
  createCreatorSchema,
  updateCreatorSchema,
  createBrandSchema,
  updateBrandSchema,
  createCampaignSchema,
  updateCampaignSchema,
  createApplicationSchema,
  updateApplicationSchema,
  createCampaignInviteSchema,
  createShortlistSchema,
  createEventSchema,
  updateEventSchema,
  updateUserRole,
};

module.exports = {
  // Schemas collection
  schemas,
  // Individual schemas (optional direct import)
  registerSchema,
  loginSchema,
  createCreatorSchema,
  updateCreatorSchema,
  createBrandSchema,
  updateBrandSchema,
  createCampaignSchema,
  updateCampaignSchema,
  createApplicationSchema,
  updateApplicationSchema,
  createCampaignInviteSchema,
  createShortlistSchema,
  createEventSchema,
  updateEventSchema,
  updateUserRole,
  // Middleware
  validate,
};