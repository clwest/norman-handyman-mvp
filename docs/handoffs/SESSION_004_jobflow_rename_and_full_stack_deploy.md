# SESSION 004 — JobFlow Rename + Full-Stack Deploy

**Date:** 2026-05-20
**Branch:** `main`
**GitHub:** `clwest/norman-handyman-mvp` (kept the original repo name)
**Display name:** JobFlow (renamed during 24/7 Global AI portfolio buildout)

## What's live right now

**Full stack working end-to-end:**

- **Frontend:** https://job-flow-iota.vercel.app (Next.js 16, Vercel free, GitHub auto-deploy)
- **Backend:** https://job-flow-api.onrender.com (Django + DRF, Render free Web Service, gunicorn 2 workers)
- **Database:** Neon free Postgres, project `job-flow`, connection string lives only in Render's `DATABASE_URL` env var

End-to-end verification done — `POST /api/booking-requests/public/` returns 201 with new row IDs. Two smoke-test rows in `booking_requests` table (id=1, id=2) — labeled "Verifying..." and safe to delete via operator UI.

## Files added this session

- `render.yaml` — Render Blueprint for the Django service
- `web/.env.production` — `NEXT_PUBLIC_API_BASE_URL=https://job-flow-api.onrender.com/api`
- `web/.gitignore` — exception added: `!.env.production` (the file is safe to commit; only public `NEXT_PUBLIC_*` vars)

Mid-deploy patch (commit `b1b67df`):
- `render.yaml` CORS_ALLOWED_ORIGINS extended to include the actual Vercel hostname `job-flow-iota.vercel.app` (Vercel assigned the `-iota` random suffix because `job-flow.vercel.app` was already taken globally)

## What's still NOT wired

- **Stripe** — `STRIPE_SECRET_KEY` left unset on purpose. Checkout endpoints return 503 "Stripe not configured" gracefully; the web UI treats this as demo mode. Add real Stripe keys when ready to accept payments.
- **Mobile app (`mobile/`)** — Expo / React Native operator app; not deployed. `mobile/package*.json` had unrelated uncommitted changes at session start; left alone.
- **Custom domain** — none attached.

## Backend env state on Render (job-flow-api)

These are set in the Render dashboard:
- `DJANGO_SECRET_KEY` — auto-generated
- `DEBUG=false`
- `ALLOWED_HOSTS=job-flow-api.onrender.com`
- `CORS_ALLOWED_ORIGINS=https://job-flow-iota.vercel.app,https://job-flow.vercel.app,https://24-7-ai-global.vercel.app`
- `DATABASE_URL=postgres://...neon.tech/neondb?sslmode=require` (Neon connection string, set manually at Blueprint activation)
- `STRIPE_SECRET_KEY` — empty (intentional, see above)

## Render free tier caveats

- Service sleeps after 15 min idle; first request after wake = ~30-50s cold start
- Filesystem is ephemeral at runtime — only files written during build persist
- Migrations run at build time via `python manage.py migrate --noinput`
- 750 hours/month free across all services in the account

## On the 24/7 landing

Card lives in `src/lib/products.ts` of the `24-7-ai-global` repo under VERTICALS. Current state (already flipped):
- `status: "shipped"`
- `subStatus: "Demo Tier"`
- `url: "https://job-flow-iota.vercel.app"`
- `repo: "https://github.com/clwest/norman-handyman-mvp"`
- `stack: "Django 5 · DRF · Next.js 16 · React 19 · Expo · Neon Postgres · Stripe"`
- `note: "Full stack live — Next.js → Render → Neon Postgres. Free tier cold-starts after 15 min idle; Stripe is stubbed."`
