#!/usr/bin/env node
/*
 * Bulk import influencers from a JSON file directly into the database via Prisma.
 * Usage:
 *   node scripts/bulk-import-from-file.js /absolute/path/to/src/entry.json
 *
 * Notes:
 * - This bypasses HTTP and JWT; it runs locally with your DATABASE_URL.
 * - It creates/updates a User (role CREATOR) and a linked Creator record.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient, UserRole } = require('@prisma/client');
const prisma = new PrismaClient();

// ---- Helpers ----
const toStringSafe = (v) => {
  if (v === null || v === undefined) return '';
  return String(v).trim();
};

function extractInstagramHandle(linkOrHandle) {
  const raw = toStringSafe(linkOrHandle);
  if (!raw) return null;
  if (!raw.startsWith('http')) {
    return raw.replace(/^@+/, '').split(/[?#]/)[0];
  }
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
  const s = toStringSafe(val);
  if (!s) return 0;
  const num = parseFloat(s.replace(/%/g, ''));
  if (!Number.isFinite(num)) return 0;
  // Heuristic: treat small numbers (<= 1.0) as already percentages (e.g., 0.06% or 0.5%),
  // and treat large numbers (>= 10) as raw counts (we’ll convert per 1K followers later).
  return num;
}

function parseCommercialRate(val) {
  const s = toStringSafe(val);
  if (!s) return 0;
  if (s.includes('-')) {
    const parts = s.split('-').map((p) => parseFloat(p.replace(/[^0-9.]/g, ''))).filter(Number.isFinite);
    if (parts.length) return (parts[0] + parts[parts.length - 1]) / 2;
    return 0;
  }
  const num = parseFloat(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

function extractGender(genderRatio) {
  const s = toStringSafe(genderRatio).toLowerCase();
  if (!s) return null;
  const female = s.match(/([0-9.]+)\s*%\s*female/);
  const male = s.match(/([0-9.]+)\s*%\s*male/);
  const f = female ? parseFloat(female[1]) : null;
  const m = male ? parseFloat(male[1]) : null;
  if (f !== null && m !== null) {
    if (f > m) return 'female';
    if (m > f) return 'male';
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

function slugify(input) {
  return toStringSafe(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

async function ensureUniqueUsername(base) {
  let candidate = base || `user-${Math.random().toString(36).slice(2, 8)}`;
  let attempt = 0;
  while (attempt < 5) {
    const exists = await prisma.creator.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
    attempt += 1;
    candidate = `${base}-${Math.random().toString(36).slice(2, 4)}`;
  }
  return `${base}-${Date.now().toString().slice(-4)}`;
}

function toCreatorInput(entry) {
  const name = toStringSafe(entry.name);
  const email = toStringSafe(entry.email) || null;
  const handle = extractInstagramHandle(entry.instagram_link);
  const displayName = name || handle || 'Unknown';
  const baseUsername = slugify(handle || name || `user-${entry.id || ''}`);
  const instagramFollowers = convertFollowerRange(entry.follower_range);
  const avgEngagementRate = parseEngagementRate(entry.engagement_rate);
  const basePrice = parseCommercialRate(entry.commercial_rate);
  const gender = extractGender(entry.gender_ratio);
  const categories = normalizeCategories(entry.niche);

  return {
    displayName,
    usernameBase: baseUsername || 'unknown',
    email,
    instagramHandle: handle,
    instagramFollowers,
    avgEngagementRate,
    basePrice,
    gender,
    location: 'India',
    age: null, // Unknown; keep null
    bio: entry.dashboard_screenshot ? `Dashboard: ${entry.dashboard_screenshot}` : null,
    categories,
    isVerified: true,
  };
}

async function upsertUserAndCreator(item) {
  const username = await ensureUniqueUsername(item.usernameBase);

  // Create or find user
  let user;
  if (item.email) {
    user = await prisma.user.findUnique({ where: { email: item.email } });
  }
  if (!user) {
    const randomPass = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(randomPass, 10);
    user = await prisma.user.create({
      data: {
        email: item.email || `${username}@example.com`,
        password: hashed,
        role: UserRole.CREATOR,
      },
    });
  }

  // Upsert creator by username if exists; otherwise by userId
  const existingByUsername = await prisma.creator.findUnique({ where: { username } });
  if (existingByUsername) {
    return prisma.creator.update({
      where: { id: existingByUsername.id },
      data: {
        displayName: item.displayName,
        bio: item.bio,
        instagramHandle: item.instagramHandle,
        instagramFollowers: item.instagramFollowers,
        avgEngagementRate: item.avgEngagementRate,
        basePrice: item.basePrice,
        age: item.age,
        location: item.location,
        gender: item.gender,
        categories: item.categories,
        isVerified: item.isVerified,
      },
    });
  }

  return prisma.creator.create({
    data: {
      userId: user.id,
      username,
      displayName: item.displayName,
      bio: item.bio,
      instagramHandle: item.instagramHandle,
      instagramFollowers: item.instagramFollowers,
      avgEngagementRate: item.avgEngagementRate,
      basePrice: item.basePrice,
      age: item.age,
      location: item.location,
      gender: item.gender,
      categories: item.categories,
      isVerified: item.isVerified,
    },
  });
}

async function main() {
  const fileArg = process.argv[2];
  const filePath = fileArg && fileArg.trim().length ? fileArg : path.resolve(__dirname, '../../src/entry.json');
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Invalid JSON:', e.message);
    process.exit(1);
  }
  if (!Array.isArray(data)) {
    data = [data];
  }
  console.log(`Found ${data.length} entries. Importing...`);

  let success = 0;
  let failed = 0;
  for (const entry of data) {
    try {
      const item = toCreatorInput(entry);
      await upsertUserAndCreator(item);
      success += 1;
    } catch (e) {
      failed += 1;
      console.error('Failed to import entry id', entry.id, e.message);
    }
  }

  console.log(`Import complete. Success: ${success}, Failed: ${failed}`);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });