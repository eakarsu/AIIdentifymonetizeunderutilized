# Governed asset workflow

`/api/governed-assets` inventories a tenant asset and its rights version, computes a trusted utilization/cost baseline, records valuation provenance and constraints, and moves reuse/lease/sale opportunities through owner review, execution, measurement, and closure. Idempotency hashes prevent key reuse, optimistic versions prevent lost updates, independent owner approval is mandatory, sensitive location fields are not returned beyond their classification, and every state change is audited.

ERP/fixed-asset, facilities/IoT, maintenance, marketplace/procurement, accounting, and identity adapters are not bundled. `ASSET_PROVIDER_ALLOWLIST` only permits recording outcomes from separately approved adapters; it does not imply connectivity. Unconfigured providers fail with 503, and failed/manual-review runs preserve explicit error state.

Apply `backend/migrations/` in numeric order through a reviewed migration process, then assign tenant IDs through an authorized identity-admin process. Install locked dependencies with `npm ci`, create an untracked `.env`, migrate explicitly, and then use `./start.sh`. Startup is non-destructive. The legacy seed is a destructive demo fixture and is opt-in only outside production.

No marketplace rights, valuation, accounting, physical inventory, privacy, or professional disposal validation is claimed. Those remain release blockers alongside database integration, authorization, and load testing.
