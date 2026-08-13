# Norman Handyman MVP

A small full-stack service-business MVP: a customer books online, an operator
manages the job on their phone, and Stripe handles the payment. Built to
exercise the whole loop — from public web intake through native photo capture
to a signed payment webhook — in the shape of a single small trade business.

> **Status: prototype.** Never deployed to real customers. Norman refers to the
> city (Norman, Oklahoma), not a person; there is no real business this MVP was
> built for.

## What it does

Three primary flows run end-to-end:

1. **Booking** — an anonymous visitor submits a job request on the web form;
   the backend persists it and (in dev) logs a confirmation email to the
   console.
2. **Payment** — an operator creates an invoice; the customer opens a public
   pay page, hits Stripe Checkout, and Stripe's signed webhook flips the
   invoice to `PAID`.
3. **Field work** — an operator signs into the Expo app, opens a job, captures
   a photo with the camera (or picks one from the library), and it uploads
   over an authenticated multipart endpoint and re-appears on the job.

## Stack

| Layer | Stack | Directory |
|---|---|---|
| Backend | Django 5 · DRF · PostgreSQL · Stripe SDK | `backend/` |
| Web (customer) | Next.js 16 (App Router) · React 19 · Tailwind 4 | `web/` |
| Mobile (operator) | Expo 55 · React Native 0.83 · expo-router · expo-image-picker | `mobile/` |
| CI | GitHub Actions (backend + web + mobile) | `.github/workflows/` |

Auth is DRF `TokenAuthentication`; the mobile app persists the token via
`AsyncStorage`. Media (job photos) is stored on the Django default file
storage under `MEDIA_ROOT/job_photos/<job_id>/<uuid>.<ext>`.

## Quick start

```bash
# 1. Start Postgres (docker compose)
make db                       # or: docker compose up -d

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # edit STRIPE_SECRET_KEY if you want to test payments
python manage.py migrate
python manage.py seed_demo    # creates an operator user + demo rows
python manage.py runserver

# 3. Web (new terminal)
cd web && npm ci && npm run dev

# 4. Mobile (new terminal)
cd mobile && npm ci && npx expo start
```

Environment variables live in three `.env.example` files (`backend/`,
`mobile/`, and `web/.env.production` for the deployed hostname). No real
credentials are needed to run the default test path — Stripe is only invoked
when you provide test keys.

## Tests

```bash
cd backend
python manage.py test                 # requires Postgres
# or, without Postgres:
USE_SQLITE=1 python manage.py test    # runs the whole suite on SQLite
```

Twenty backend tests cover public booking creation, the operator/anonymous
permission boundary, Stripe webhook signature verification + PAID transition
+ replay idempotency, and the photo-upload contract (auth, MIME allowlist,
size cap, path safety).

Web and mobile are typechecked in CI (`tsc --noEmit`) and web is linted +
built. There are no frontend unit tests — intentionally out of scope for
an MVP of this size.

## Stripe (test mode)

The backend uses [Stripe Checkout Sessions](https://stripe.com/docs/checkout)
plus a signed webhook. To exercise the payment flow locally:

```bash
# .env
STRIPE_SECRET_KEY=sk_test_...

stripe listen --forward-to localhost:8000/api/webhooks/stripe/
# copy the whsec_... it prints into STRIPE_WEBHOOK_SECRET
```

If `STRIPE_SECRET_KEY` is unset, the checkout endpoints return
`503 Stripe not configured` and the pay page treats it as demo mode — the
rest of the app still works.

## Media / photo upload

The mobile app uses `expo-image-picker` for camera + library access. Uploads
go to `POST /api/jobs/{id}/photos/` as `multipart/form-data`, with:

- authentication required (DRF token)
- MIME allowlist: jpeg / png / webp / heic / heif (415 otherwise)
- max 10 MiB per upload (configurable via `MAX_UPLOAD_SIZE_BYTES`; 413 otherwise)
- the server writes to `MEDIA_ROOT/job_photos/<job_id>/<uuid>.<ext>` — the
  client filename is never trusted, which blocks path traversal
- in `DEBUG` the media directory is served from `MEDIA_URL`; production
  deployments should front it with a proper object store

## Architecture

```
web  ─┐
      ├──► Django REST (public + operator endpoints) ──► PostgreSQL
mobile┘                                              └─► MEDIA_ROOT
                          │
                          └──► Stripe Checkout ─── webhook ──► Invoice.status = PAID
```

Data model: `Customer → BookingRequest → Job → Estimate / Invoice → Stripe`.

Public endpoints (no auth): booking intake, invoice view, checkout creation,
webhook.

Operator endpoints (token auth): customers, booking-requests, jobs, estimates,
invoices, expenses, supplies — plus custom actions (`convert_to_job`, `start`,
`complete`, `send_estimate`, `send_invoice`, `mark_paid`, `create_checkout`,
`photos`).

## Intentionally out of scope

This is an MVP, not a product. The following are deliberately not implemented:

- push notifications
- offline sync / write queue
- background uploads
- image editing or thumbnails
- receipt photos on expenses (only jobs have photo capture)
- multi-operator role/permission split
- SMS / real email (dev uses the console backend; production `EMAIL_BACKEND`
  is env-configurable but nothing is wired to a real provider)
- object storage (S3/GCS) for media
- payment refunds, partial payments, or reconciliation
- native tests (Jest / Detox)

## AI-assisted development

This project was built quickly with substantial AI-assisted coding. Product
scope, workflow modeling, architectural choices, security controls, review,
testing, and acceptance decisions were human-directed. The value this repo
demonstrates is conventional full-stack product engineering (Django + Next +
Expo + Stripe), not an AI product.

## License

MIT — see [LICENSE](./LICENSE).
