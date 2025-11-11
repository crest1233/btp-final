const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const creatorRoutes = require('./routes/creators');
const brandRoutes = require('./routes/brands');
const campaignRoutes = require('./routes/campaigns');
const shortlistRoutes = require('./routes/shortlists');
const uploadRoutes = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());

// Allow multiple origins via env: ALLOWED_ORIGINS (comma-separated) or FRONTEND_URL
const allowedOriginsRaw = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Normalize entries: strip quotes/backticks and trailing slashes
const normalizeEntry = (s) => s.replace(/^['"`]+|['"`]+$/g, '').replace(/\/+$/, '');
const allowedOrigins = allowedOriginsRaw.map(normalizeEntry);
const allowAnyOrigin = allowedOrigins.includes('*');

// Convert wildcard patterns like https://*.netlify.app to RegExp
const toOriginRegex = (pattern) => {
  const n = normalizeEntry(pattern);
  if (n === '*') return /.*/; // match any origin safely
  const p = n
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // escape regex chars (not *)
    .replace(/\*/g, '.*'); // unescaped * -> .*
  return new RegExp(`^${p}$`);
};
const wildcardMatchers = allowedOrigins
  .filter((o) => o.includes('*') && o !== '*')
  .map(toOriginRegex);

app.use(cors({
  origin: (origin, callback) => {
    if (allowAnyOrigin) return callback(null, true);
    const o = origin ? normalizeEntry(origin) : origin;
    const exactMatch = !o || allowedOrigins.includes(o);
    const wildcardMatch = o && wildcardMatchers.some((re) => re.test(o));
    if (exactMatch || wildcardMatch) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin, 'allowed:', allowedOrigins.join(', '));
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting (skip health check)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl && req.originalUrl.startsWith('/api/health')
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root OK for default health checks
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// Health check (supports /api/health and /api/health/; GET + HEAD)
const healthPayload = () => ({
  status: 'OK',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV
});
app.get(/^\/api\/health\/?$/, (req, res) => {
  res.json(healthPayload());
});
app.head(/^\/api\/health\/?$/, (req, res) => {
  res.status(200).end();
});

// Optional secondary health path
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/shortlists', shortlistRoutes);
app.use('/api/uploads', uploadRoutes);

// 404 handler
app.use('*', (req, res) => {
  console.warn('404 route not found:', req.method, req.originalUrl);
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔐 Allowed origins: ${allowedOrigins.join(', ')}`);
});