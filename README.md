# Norman Handyman MVP

Two-sided handyman business app: **Customer web** (book appointments, pay invoices) + **Operator mobile** (manage jobs, estimates, invoices, expenses, supplies).

## Architecture

```
/backend   — Django + DRF + PostgreSQL
/web       — Next.js (App Router) customer-facing site
/mobile    — Expo (React Native) operator app
```

## Quick Start

```bash
# 1. Start database
make db

# 2. Backend setup
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your values
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# 3. Web (separate terminal)
cd web
npm install
npm run dev

# 4. Mobile (separate terminal)
cd mobile
npm install
npx expo start
```

## Stripe Webhooks (Local Dev)

```bash
stripe listen --forward-to localhost:8000/api/webhooks/stripe/
# Copy the whsec_... secret into backend/.env
```

## API Endpoints

### Public (no auth)
- `POST /api/booking-requests/public/` — Submit booking request
- `GET /api/invoices/public/{id}/` — View invoice

### Operator (auth required)
- `/api/customers/` — CRUD
- `/api/booking-requests/` — CRUD + `POST {id}/convert_to_job/`
- `/api/jobs/` — CRUD + `POST {id}/start/` + `POST {id}/complete/`
- `/api/estimates/` — CRUD + `POST {id}/send_estimate/`
- `/api/invoices/` — CRUD + `POST {id}/send_invoice/` + `POST {id}/mark_paid/` + `POST {id}/create_checkout/`
- `/api/expenses/` — CRUD
- `/api/supplies/` — CRUD

### Webhooks
- `POST /api/webhooks/stripe/` — Stripe checkout.session.completed → marks invoice PAID
