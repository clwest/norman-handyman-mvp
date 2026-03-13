.PHONY: help db backend web mobile setup test

help:
	@echo "Norman Handyman MVP"
	@echo "-------------------"
	@echo "make setup     - First-time setup (db + backend + web + mobile)"
	@echo "make db        - Start Postgres + Redis via Docker"
	@echo "make backend   - Run Django dev server (port 8000)"
	@echo "make web       - Run Next.js dev server (port 3000)"
	@echo "make mobile    - Start Expo dev server"
	@echo "make migrate   - Run Django migrations"
	@echo "make test      - Run all tests"
	@echo "make stripe    - Start Stripe CLI webhook forwarding"

db:
	docker compose up -d

backend:
	cd backend && python manage.py runserver 0.0.0.0:8000

web:
	cd web && npm run dev

mobile:
	cd mobile && npx expo start

migrate:
	cd backend && python manage.py migrate

setup: db
	cd backend && pip install -r requirements.txt && python manage.py migrate && python manage.py createsuperuser --noinput || true
	cd web && npm install
	cd mobile && npm install
	@echo "\n✓ Setup complete. Run 'make backend', 'make web', 'make mobile' in separate terminals."

test:
	cd backend && python manage.py test
	cd web && npm test || true

stripe:
	stripe listen --forward-to localhost:8000/api/webhooks/stripe/
