# Migrate to a Free Postgres (Neon) and Update Backend

This backend uses Prisma with a `DATABASE_URL` environment variable. If your Render Postgres trial expired, you can migrate to Neon’s free Postgres and update the backend in a few minutes.

## Overview
- Create a free Neon Postgres
- Update `DATABASE_URL` (use `?sslmode=require`)
- Apply schema to the new DB
- Seed optional starter data
- Update environment variables where you deploy the backend
- Verify connectivity via the new DB health endpoint

## 1) Create a Neon Postgres
1. Sign up at https://neon.tech
2. Create a project and database.
3. In the Neon console, open “Connection String”. Copy the **Pooler** URL (recommended) and ensure it includes `?sslmode=require`, e.g.:

   `postgresql://<user>:<password>@ep-xxxxx-pooler.us-east-1.aws.neon.tech/<db>?sslmode=require`

## 2) Set `DATABASE_URL`
- Locally: update `server/.env` → `DATABASE_URL="<neon-url-with-ssl>"`
- On your deployment (Render or similar): set the environment variable `DATABASE_URL` to the same Neon URL.

See `server/.env.example` for an example and a Neon-specific comment.

## 3) Apply schema
From the `server` directory:

```bash
# Install deps if needed
npm install

# Generate Prisma client
npm run db:generate

# Create/update tables to match the schema (non-destructive)
npm run db:push

# Alternatively, if you use Prisma migrations:
# prisma migrate dev (development) or prisma migrate deploy (production)
```

## 4) Seed data (optional)
There is a seed script wired to Prisma:

```bash
# Run seed (adjust data sources in prisma/seed.js as needed)
npm run db:seed
```

## 5) Migrate old data from Render (optional)
If your old Render Postgres is still accessible during the grace period, you can dump and restore:

```bash
# From Render (old DB)
pg_dump "<render-postgres-url>" --no-owner --no-privileges --format=plain > render_dump.sql

# To Neon (new DB)
psql "<neon-postgres-url-with-ssl>" -f render_dump.sql
```

Notes:
- If you used different schemas or extensions, inspect `render_dump.sql` for any statements Neon might not support and adjust accordingly.

## 6) Update deployment env and restart
- Ensure your deployment service has `DATABASE_URL` set to the Neon URL.
- Restart/redeploy your backend.

## 7) Verify connectivity
- Health check: `GET /api/health` returns server status.
- DB connectivity: `GET /api/health/db` now returns `{ status: "OK", database: "connected" }` when Prisma can reach the DB.

## Troubleshooting
- TLS/SSL errors: confirm your `DATABASE_URL` has `?sslmode=require`.
- Connection limits: on Neon, prefer the **pooler** endpoint to avoid exhausting connections.
- Prisma errors: run `npm run db:generate` after changing `DATABASE_URL` and check `prisma/schema.prisma` points to `env("DATABASE_URL")`.

## Where things are defined
- Prisma schema: `server/prisma/schema.prisma`
- Seed script: `server/prisma/seed.js`
- Health endpoints: `server/server.js` (`/api/health`, `/api/health/db`)

