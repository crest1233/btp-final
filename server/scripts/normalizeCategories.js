/*
 * Normalize creator categories to lowercase and deduplicate
 * Usage: from server directory run `node scripts/normalizeCategories.js`
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizeArray(arr) {
  const cats = Array.isArray(arr) ? arr : [];
  const lowered = cats
    .map((x) => String(x).trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(lowered));
}

async function main() {
  const creators = await prisma.creator.findMany({
    select: { id: true, categories: true }
  });

  let updated = 0;
  for (const c of creators) {
    const normalized = normalizeArray(c.categories);
    // Only update if there is a change
    const before = JSON.stringify(c.categories || []);
    const after = JSON.stringify(normalized);
    if (before !== after) {
      await prisma.creator.update({
        where: { id: c.id },
        data: { categories: normalized },
      });
      updated += 1;
    }
  }

  console.log(`Normalization complete. Updated ${updated} of ${creators.length} creators.`);
}

main()
  .catch((e) => {
    console.error('Normalization failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });