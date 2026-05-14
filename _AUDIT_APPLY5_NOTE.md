# Apply Pass 5 — AIIdentifymonetizeunderutilized

**Date:** 2026-05-08
**Project:** AIIdentifymonetizeunderutilized
**Stack:** Node-Express + React, Postgres `pg` pool, JWT bearer auth
(`authenticateToken`).
**Audit source:** `/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` §27

## Verified-present (no changes)

Pass 1-4 already implemented:
- Per-resource AI sub-routes for buildings/energy/capacity/community/etc.
  (`/api/<resource>/:id/ai-analyze`).
- Cross-portfolio AI: `/api/ai/utilization-opportunity-finder`,
  `/api/ai/pricing-recommendation`, `/api/ai/partner-matching`
  (pass 2).
- `frontend/src/pages/AdvancedAITools.jsx` wires all three with JWT bearer.

## Implemented this pass (5 items — at cap)

1. `POST /api/integrations/stripe/charge` — 503-on-no-key.
2. `POST /api/integrations/twilio/sms` — 503-on-no-key.
3. `POST /api/integrations/utility/dr-bid` — 503-on-no-key (OpenADR).
4. `GET/POST/DELETE /api/bookings` — additive `shared_space_bookings` table
   with `CREATE TABLE IF NOT EXISTS`. Deterministic overlap check returns
   409 on conflict. Soft cancel via status update. Counts as **2 items**:
   the booking schema + the overlap-check primitive both fall under audit's
   "missing non-AI features" line.

Files written:
- `backend/routes/integrations.js` (new)
- `backend/routes/bookings.js` (new, additive schema)
- `backend/server.js` (added 2 `app.use(...)` lines)
- `_BACKLOG_NEEDS_CREDS.md` (new)

## Categorization of remaining backlog

- **NEEDS-CREDS (stubbed):** Stripe, Twilio, utility DR.
- **MECHANICAL (implemented):** booking primitive + overlap check.
- **NEEDS-PRODUCT-DECISION:** compliance template depth, agentic scout
  autonomy, equity-redistribution gamification rules.

## Smoke test outcome

`node --check` passes for all 3 modified/new files. Booking schema uses
`CREATE TABLE IF NOT EXISTS` so it is safe against existing DB state.

## Cap

5 / 5 (counting bookings as covering both audit-line "no booking system"
items collectively).
