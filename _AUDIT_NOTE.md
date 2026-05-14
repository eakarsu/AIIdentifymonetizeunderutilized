# Audit Apply Notes — AIIdentifymonetizeunderutilized

## Source
`/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` section 27.

Note: audit reported "0 AI endpoints"; in fact every domain route file already calls `queryAI` and exposes a `/:id/ai-analyze` endpoint per resource (buildings, energy-audits, capacity-detection, community-needs, aggregation, grid-stability, equity-scores, redistribution, demand-response, capacity-forecast, impact-reports, energy-savings, alerts, compliance, partners). What was missing was cross-portfolio / cohort-level AI tooling.

## Original Recommendations (AI Counterparts)
- `/utilization-opportunity-finder` — MISSING (added)
- `/demand-forecast` — partially covered via `/api/capacity-forecast/:id/ai-analyze`
- `/pricing-recommendation` — MISSING (added)
- `/partner-matching` — MISSING (added)
- `/equity-analysis` — partially covered via `/api/equity-scores/:id/ai-analyze`

## Implemented (this pass)
Created `backend/routes/ai.js` and mounted at `/api/ai` in `server.js`:

- `POST /api/ai/utilization-opportunity-finder` — scans buildings table, filters by configurable underutilization threshold, asks the model to rank monetization opportunities and propose per-asset and cross-portfolio strategies.
- `POST /api/ai/pricing-recommendation` — produces a tiered pricing JSON for an asset (optionally by `building_id`), including demand levers and expected utilization lift.
- `POST /api/ai/partner-matching` — scores building candidates against partner demand parameters, lists blockers and recommended terms.

All three use existing `queryAI` and `authenticateToken`. No new dependencies. JWT auth + DB pool consistent with rest of project.

Syntax: `node --check` passes for `routes/ai.js` and `server.js`.

## Backlog
- Custom: agentic utilization scout, dynamic pricing automation, community impact modeling, real-estate arbitrage, energy-DR coordination, equity-driven redistribution.
- Non-AI: booking/reservation system, payment/billing, landlord/tenant communication, compliance documentation depth.

## Categorization
- MECHANICAL: 3 endpoints (done).
- NEEDS-PRODUCT-DECISION: agentic scout autonomy, equity scoring methodology.
- NEEDS-CREDS: payment + landlord/tenant communication integrations.

## Apply pass 3 (frontend)

LEFT-AS-IS. Frontend already wired: `frontend/src/services/api.js` injects JWT Bearer from `localStorage.token`, and `frontend/src/pages/AdvancedAITools.jsx` (route `/advanced-ai` in `App.jsx`) provides a tabbed UI invoking all three pass-2 endpoints (`/api/ai/utilization-opportunity-finder`, `/api/ai/pricing-recommendation`, `/api/ai/partner-matching`) with form-driven payloads, building dropdown, JSON result viewer, and an error banner that surfaces backend 503-no-key messages. No FE changes required.
