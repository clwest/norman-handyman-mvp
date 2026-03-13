"""Seed demo data for Norman Handyman MVP."""

from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from rest_framework.authtoken.models import Token

from handyman.core.models import (
    BookingRequest,
    Customer,
    Estimate,
    Expense,
    Invoice,
    Job,
    SupplyItem,
)


class Command(BaseCommand):
    help = "Seed demo data for Norman Handyman MVP"

    def handle(self, *args, **options):
        # Operator user
        operator, created = User.objects.get_or_create(
            username="operator",
            defaults={
                "first_name": "Norman",
                "last_name": "Handyman",
                "email": "operator@normanhandyman.com",
                "is_staff": True,
            },
        )
        if created:
            operator.set_password("handyman123")
            operator.save()
            self.stdout.write(self.style.SUCCESS("Created operator user (operator / handyman123)"))
        else:
            self.stdout.write("Operator user already exists")

        # Create auth token
        token, _ = Token.objects.get_or_create(user=operator)
        self.stdout.write(f"Auth token: {token.key}")

        # Customers
        c1, _ = Customer.objects.get_or_create(
            email="sarah.johnson@example.com",
            defaults={
                "name": "Sarah Johnson",
                "phone": "(405) 555-0101",
                "address": "1234 Elm Street, Norman, OK 73069",
            },
        )
        c2, _ = Customer.objects.get_or_create(
            email="mike.chen@example.com",
            defaults={
                "name": "Mike Chen",
                "phone": "(405) 555-0202",
                "address": "5678 Oak Avenue, Norman, OK 73072",
            },
        )
        c3, _ = Customer.objects.get_or_create(
            email="linda.brooks@example.com",
            defaults={
                "name": "Linda Brooks",
                "phone": "(405) 555-0303",
                "address": "910 Maple Drive, Norman, OK 73071",
            },
        )

        today = date.today()

        # Booking request (NEW — ready for demo conversion)
        BookingRequest.objects.get_or_create(
            customer_name="Robert Williams",
            customer_email="robert.w@example.com",
            defaults={
                "customer_phone": "(405) 555-0404",
                "customer_address": "2345 Pine Road, Norman, OK 73069",
                "description": "Kitchen light fixture stopped working — three ceiling lights in the kitchen are out. Also need the garbage disposal looked at, it's making a grinding noise. Available most mornings.",
                "preferred_date": today + timedelta(days=3),
                "status": "NEW",
            },
        )

        BookingRequest.objects.get_or_create(
            customer_name="Patricia Davis",
            customer_email="pat.davis@example.com",
            defaults={
                "customer_phone": "(405) 555-0505",
                "customer_address": "6789 Birch Lane, Norman, OK 73072",
                "description": "Need help installing a new ceiling fan in the master bedroom and replacing two bathroom light fixtures. Would also like a GFCI outlet installed in the garage.",
                "preferred_date": today + timedelta(days=5),
                "status": "NEW",
            },
        )

        # Jobs
        j1, _ = Job.objects.get_or_create(
            customer=c1,
            title="Replace kitchen light fixtures (3)",
            defaults={
                "description": "Replace 3 recessed kitchen lights with LED fixtures. Customer prefers warm white (3000K).",
                "status": "SCHEDULED",
                "scheduled_date": today,
            },
        )
        j2, _ = Job.objects.get_or_create(
            customer=c2,
            title="TV mount + outlet installation",
            defaults={
                "description": "Mount 65-inch TV above fireplace. Install outlet behind TV for clean cable management.",
                "status": "SCHEDULED",
                "scheduled_date": today + timedelta(days=1),
            },
        )
        j3, _ = Job.objects.get_or_create(
            customer=c3,
            title="Bathroom repairs — faucet + caulking",
            defaults={
                "description": "Replace master bath faucet, re-caulk shower, fix loose towel bar.",
                "status": "COMPLETED",
                "scheduled_date": today - timedelta(days=2),
            },
        )

        # Estimate (SENT)
        Estimate.objects.get_or_create(
            job=j1,
            customer=c1,
            defaults={
                "status": "SENT",
                "line_items": [
                    {"description": "LED recessed light fixture (x3)", "qty": 3, "unit_price": "45.00"},
                    {"description": "Installation labor (1.5 hrs)", "qty": 1, "unit_price": "120.00"},
                    {"description": "Wiring materials", "qty": 1, "unit_price": "25.00"},
                ],
                "total": Decimal("280.00"),
                "sent_at": today - timedelta(days=1),
            },
        )

        # Invoice — SENT (unpaid, ready for demo payment)
        Invoice.objects.get_or_create(
            job=j3,
            customer=c3,
            defaults={
                "status": "SENT",
                "line_items": [
                    {"description": "Moen bathroom faucet", "qty": 1, "unit_price": "89.00"},
                    {"description": "Shower re-caulking (silicone)", "qty": 1, "unit_price": "65.00"},
                    {"description": "Towel bar repair + remount", "qty": 1, "unit_price": "35.00"},
                    {"description": "Labor (2 hrs)", "qty": 1, "unit_price": "160.00"},
                ],
                "total": Decimal("349.00"),
                "sent_at": today - timedelta(days=1),
            },
        )

        # Expenses
        Expense.objects.get_or_create(
            description="LED fixtures from Home Depot",
            defaults={
                "amount": Decimal("135.00"),
                "category": "MATERIALS",
                "date": today - timedelta(days=3),
            },
        )
        Expense.objects.get_or_create(
            description="Moen faucet — Lowe's",
            defaults={
                "amount": Decimal("89.00"),
                "category": "MATERIALS",
                "date": today - timedelta(days=4),
            },
        )
        Expense.objects.get_or_create(
            description="Gas — weekly fill-up",
            defaults={
                "amount": Decimal("52.00"),
                "category": "FUEL",
                "date": today - timedelta(days=1),
            },
        )

        # Supplies
        for item_data in [
            {"name": "Wire nuts (assorted)", "quantity_on_hand": 45, "reorder_threshold": 20, "unit": "pack"},
            {"name": "Outlet covers (white)", "quantity_on_hand": 8, "reorder_threshold": 10, "unit": "each"},
            {"name": "Drywall anchors", "quantity_on_hand": 3, "reorder_threshold": 10, "unit": "pack"},
            {"name": "Silicone caulk (clear)", "quantity_on_hand": 2, "reorder_threshold": 3, "unit": "tube"},
            {"name": "GFCI outlets", "quantity_on_hand": 4, "reorder_threshold": 5, "unit": "each"},
            {"name": "Electrical tape", "quantity_on_hand": 6, "reorder_threshold": 3, "unit": "roll"},
        ]:
            SupplyItem.objects.get_or_create(name=item_data["name"], defaults=item_data)

        self.stdout.write(self.style.SUCCESS("\nDemo data seeded successfully!"))
        self.stdout.write(f"\nOperator login: operator / handyman123")
        self.stdout.write(f"Auth token: {token.key}")
        self.stdout.write(f"\nCustomers: {Customer.objects.count()}")
        self.stdout.write(f"Booking Requests: {BookingRequest.objects.count()}")
        self.stdout.write(f"Jobs: {Job.objects.count()}")
        self.stdout.write(f"Estimates: {Estimate.objects.count()}")
        self.stdout.write(f"Invoices: {Invoice.objects.count()}")
        self.stdout.write(f"Expenses: {Expense.objects.count()}")
        self.stdout.write(f"Supplies: {SupplyItem.objects.count()}")
