#!/usr/bin/env node
/*
 * Copy data from a source Postgres into the current Neon Postgres via Prisma.
 *
 * Usage:
 *   SOURCE_DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" node scripts/migrate-from-source.js
 *   # or
 *   node scripts/migrate-from-source.js "postgresql://user:pass@host/db?sslmode=require"
 *
 * Notes:
 * - This script preserves record IDs and foreign keys by inserting raw data.
 * - Run it against an EMPTY target DB to avoid unique constraint conflicts.
 * - Order matters: it migrates Users → Creators/Brands → Campaigns → Applications → Shortlists → Deals → Invoices → InvoiceItems → Ideas → Analytics → Events → MediaKit.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const sourceUrlArg = process.argv[2];
const SOURCE_DATABASE_URL = sourceUrlArg || process.env.SOURCE_DATABASE_URL;
if (!SOURCE_DATABASE_URL) {
  console.error('ERROR: Provide SOURCE_DATABASE_URL (env or first arg).');
  process.exit(1);
}

const source = new PrismaClient({ datasources: { db: { url: SOURCE_DATABASE_URL } } });
const target = new PrismaClient();

const copyMany = async (label, fetch, insert) => {
  const items = await fetch();
  const count = items.length;
  if (count === 0) {
    console.log(`• ${label}: nothing to copy`);
    return 0;
  }
  // createMany is faster, but we need raw objects without relations
  await insert(items);
  console.log(`✓ ${label}: copied ${count}`);
  return count;
};

const main = async () => {
  console.log('Starting data copy...');
  console.log('Source:', SOURCE_DATABASE_URL.replace(/:[^:@/]+@/, '://****@')); // redact password
  console.log('Target:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@/]+@/, '://****@') : '(env DATABASE_URL)');

  // Users
  await copyMany('users',
    () => source.user.findMany({}),
    (rows) => target.user.createMany({ data: rows, skipDuplicates: true })
  );

  // Creators
  await copyMany('creators',
    () => source.creator.findMany({}),
    (rows) => target.creator.createMany({ data: rows, skipDuplicates: true })
  );

  // Brands
  await copyMany('brands',
    () => source.brand.findMany({}),
    (rows) => target.brand.createMany({ data: rows, skipDuplicates: true })
  );

  // Campaigns
  await copyMany('campaigns',
    () => source.campaign.findMany({}),
    (rows) => target.campaign.createMany({ data: rows, skipDuplicates: true })
  );

  // Campaign Applications
  await copyMany('campaign_applications',
    () => source.campaignApplication.findMany({}),
    (rows) => target.campaignApplication.createMany({ data: rows, skipDuplicates: true })
  );

  // Shortlists
  await copyMany('shortlists',
    () => source.shortlist.findMany({}),
    (rows) => target.shortlist.createMany({ data: rows, skipDuplicates: true })
  );

  // Deals
  await copyMany('deals',
    () => source.deal.findMany({}),
    (rows) => target.deal.createMany({ data: rows, skipDuplicates: true })
  );

  // Invoices
  await copyMany('invoices',
    () => source.invoice.findMany({}),
    (rows) => target.invoice.createMany({ data: rows, skipDuplicates: true })
  );

  // Invoice Items
  await copyMany('invoice_items',
    () => source.invoiceItem.findMany({}),
    (rows) => target.invoiceItem.createMany({ data: rows, skipDuplicates: true })
  );

  // Ideas
  await copyMany('ideas',
    () => source.idea.findMany({}),
    (rows) => target.idea.createMany({ data: rows, skipDuplicates: true })
  );

  // Analytics Snapshots
  await copyMany('analytics_snapshots',
    () => source.analyticsSnapshot.findMany({}),
    (rows) => target.analyticsSnapshot.createMany({ data: rows, skipDuplicates: true })
  );

  // Events
  await copyMany('events',
    () => source.event.findMany({}),
    (rows) => target.event.createMany({ data: rows, skipDuplicates: true })
  );

  // Media Kit
  await copyMany('media_kits',
    () => source.mediaKit.findMany({}),
    (rows) => target.mediaKit.createMany({ data: rows, skipDuplicates: true })
  );

  console.log('All done.');
};

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await source.$disconnect();
    await target.$disconnect();
  });

