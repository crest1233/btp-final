require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const models = [
    'user',
    'creator',
    'brand',
    'campaign',
    'campaignApplication',
    'shortlist',
    'deal',
    'invoice',
    'invoiceItem',
    'idea',
    'analyticsSnapshot',
    'event',
    'mediaKit',
  ];

  const results = {};
  try {
    for (const m of models) {
      try {
        results[m] = await prisma[m].count();
      } catch (e) {
        results[m] = `ERROR: ${e.message}`;
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  // Pretty print
  for (const key of Object.keys(results)) {
    console.log(`${key}: ${results[key]}`);
  }
}

main().catch((e) => {
  console.error('Count script failed:', e);
  process.exit(1);
});

