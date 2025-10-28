/*
 * Prisma seed script: imports creators from src/entry.json
 * Run: npx prisma db seed (from the server directory)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient, UserRole } = require('@prisma/client');
const prisma = new PrismaClient();

// --- Helpers ---
const toStringSafe = (v) => (v === null || v === undefined) ? '' : String(v).trim();

function firstName(name) {
  const s = toStringSafe(name);
  if (!s) return 'creator';
  return s.split(/\s+/)[0].toLowerCase();
}

function random3() {
  return String(Math.floor(100 + Math.random() * 900));
}

function makeUsername(name) {
  return `${firstName(name)}${random3()}`;
}

function extractInstagramHandle(linkOrHandle) {
  const raw = toStringSafe(linkOrHandle);
  if (!raw) return null;
  if (!raw.startsWith('http')) return raw.replace(/^@+/, '').split(/[?#]/)[0];
  try {
    const url = new URL(raw);
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => p.toLowerCase() === 'profilecard');
    const handlePart = idx > 0 ? parts[idx - 1] : (parts[1] || parts[0] || '');
    return handlePart.replace(/^@+/, '').split(/[?#]/)[0];
  } catch {
    return raw.replace(/^@+/, '').split(/[?#]/)[0];
  }
}

function convertFollowerRange(range) {
  const s = toStringSafe(range).toLowerCase();
  if (!s) return 0;
  if (s.includes('+')) {
    const n = parseInt(s.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  }
  const match = s.match(/([0-9.,]+)\s*([km])?/g);
  if (!match) return 0;
  let nums = match.map((m) => {
    const num = parseFloat(m.replace(/[^0-9.]/g, ''));
    const hasK = /k/i.test(m);
    const hasM = /m/i.test(m);
    return hasM ? num * 1_000_000 : hasK ? num * 1_000 : num;
  });
  if (nums.length === 1) return Math.round(nums[0]);
  return Math.round((nums[0] + nums[1]) / 2);
}

function parseEngagementRate(val) {
  const s = toStringSafe(val).replace('%', '');
  const num = parseFloat(s);
  return Number.isFinite(num) ? num : 0;
}

function parseCommercialRate(val) {
  const s = toStringSafe(val);
  if (s.includes('-')) {
    const parts = s.split('-').map((p) => parseFloat(p.replace(/[^0-9.]/g, ''))).filter(Number.isFinite);
    return parts.length ? (parts[0] + parts[parts.length - 1]) / 2 : 0;
  }
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function extractGender(genderRatio) {
  const s = toStringSafe(genderRatio).toLowerCase();
  if (!s) return null;
  const f = s.match(/([0-9.]+)\s*%\s*female/);
  const m = s.match(/([0-9.]+)\s*%\s*male/);
  const fv = f ? parseFloat(f[1]) : null;
  const mv = m ? parseFloat(m[1]) : null;
  if (fv !== null && mv !== null) {
    if (fv > mv) return 'female';
    if (mv > fv) return 'male';
    return 'other';
  }
  if (s.includes('female')) return 'female';
  if (s.includes('male')) return 'male';
  return null;
}

function normalizeCategories(niche) {
  const s = toStringSafe(niche);
  if (!s) return [];
  return s.split(/[,&/]/).map((p) => p.trim()).filter(Boolean);
}

async function main() {
  const filePath = path.resolve(__dirname, '../../src/entry.json');
  if (!fs.existsSync(filePath)) {
    console.error('entry.json not found at:', filePath);
    process.exit(1);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  let entries = [];
  try {
    entries = JSON.parse(raw);
  } catch (e) {
    console.error('Invalid JSON in entry.json:', e.message);
    process.exit(1);
  }
  if (!Array.isArray(entries)) entries = [entries];

  const passwordHash = await bcrypt.hash('creator123', 10);
  let created = 0;
  let skipped = 0;

  for (const e of entries) {
    const email = toStringSafe(e.email);
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        skipped += 1;
        continue; // Skip duplicates if email already exists
      }
    }

    const username = makeUsername(e.name);
    const displayName = toStringSafe(e.name) || username;
    const instagramHandle = extractInstagramHandle(e.instagram_link);
    const instagramFollowers = convertFollowerRange(e.follower_range);
    const avgEngagementRate = parseEngagementRate(e.engagement_rate);
    const basePrice = parseCommercialRate(e.commercial_rate);
    const gender = extractGender(e.gender_ratio);
    const categories = normalizeCategories(e.niche);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email || `${username}@seed.local`,
        password: passwordHash,
        role: UserRole.CREATOR,
      },
    });

    // Create creator
    await prisma.creator.create({
      data: {
        userId: user.id,
        username,
        displayName,
        bio: e.dashboard_screenshot ? `Dashboard: ${toStringSafe(e.dashboard_screenshot)}` : null,
        instagramHandle,
        instagramFollowers,
        avgEngagementRate,
        basePrice,
        age: null,
        location: 'India',
        gender,
        categories,
        isVerified: true,
      },
    });

    created += 1;
  }

  console.log(`Seed complete. Created: ${created}, Skipped (email exists): ${skipped}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });