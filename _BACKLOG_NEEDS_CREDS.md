# Backlog: Needs Credentials — AIIdentifymonetizeunderutilized

Apply pass 5 stubs. Each route returns 503 with `missing_env` until env vars
are populated.

## Stripe — booking deposits / payments
- **Endpoint:** `POST /api/integrations/stripe/charge`
- **Env:** `STRIPE_SECRET_KEY`
- **Wire-up TODO:** PaymentIntent for `shared_space_bookings.price_cents`.

## Twilio — landlord/tenant SMS
- **Endpoint:** `POST /api/integrations/twilio/sms`
- **Env:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- **Wire-up TODO:** Templated booking confirmations + DR notifications.

## Utility / grid operator demand response
- **Endpoint:** `POST /api/integrations/utility/dr-bid`
- **Env:** `UTILITY_API_BASE`, `UTILITY_API_KEY`, `UTILITY_ACCOUNT_ID`
- **Wire-up TODO:** OpenADR 2.0a/b bid submission; map building loads to
  shed-able assets.

## Backlog NOT mechanical (deferred)

- **Compliance documentation depth** — needs jurisdiction-specific templates
  (NEEDS-PRODUCT-DECISION).
- **Agentic utilization scout** — autonomy bounds NEEDS-PRODUCT-DECISION.
- **Equity-driven redistribution gamification** — UX + policy decisions
  (NEEDS-PRODUCT-DECISION).
