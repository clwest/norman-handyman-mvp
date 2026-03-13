"""Norman Handyman MVP — Core Models."""

from django.conf import settings
from django.db import models


class Customer(models.Model):
    """A customer / homeowner."""

    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class BookingRequest(models.Model):
    """Public intake form — no login required."""

    class Status(models.TextChoices):
        NEW = "NEW", "New"
        CONTACTED = "CONTACTED", "Contacted"
        SCHEDULED = "SCHEDULED", "Scheduled"
        CLOSED = "CLOSED", "Closed"

    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField(blank=True)
    customer_phone = models.CharField(max_length=30, blank=True)
    customer_address = models.TextField(blank=True)
    description = models.TextField(help_text="What do you need help with?")
    preferred_date = models.DateField(null=True, blank=True)
    photo_urls = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    customer = models.ForeignKey(
        Customer, null=True, blank=True, on_delete=models.SET_NULL, related_name="booking_requests"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.customer_name} — {self.description[:50]}"


class Job(models.Model):
    """A scheduled job / work order."""

    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELED = "CANCELED", "Canceled"

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="jobs")
    booking_request = models.ForeignKey(
        BookingRequest, null=True, blank=True, on_delete=models.SET_NULL, related_name="jobs"
    )
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    scheduled_date = models.DateField(null=True, blank=True)
    scheduled_time = models.TimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-scheduled_date", "-created_at"]

    def __str__(self):
        return f"{self.title} — {self.customer.name}"


class Estimate(models.Model):
    """A price estimate for a job."""

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SENT = "SENT", "Sent"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="estimates")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="estimates")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    line_items = models.JSONField(
        default=list,
        help_text='[{"description": "...", "qty": 1, "unit_price": "50.00"}, ...]',
    )
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    disclaimer = models.TextField(
        blank=True,
        default="This estimate is valid for 30 days. Prices may vary based on actual conditions.",
    )
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Estimate #{self.pk} — {self.customer.name} — ${self.total}"

    def recalculate_total(self):
        from decimal import Decimal

        total = Decimal("0")
        for item in self.line_items or []:
            qty = Decimal(str(item.get("qty", 1)))
            price = Decimal(str(item.get("unit_price", 0)))
            total += qty * price
        self.total = total


class Invoice(models.Model):
    """An invoice — optionally linked to a job/estimate."""

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SENT = "SENT", "Sent"
        PAID = "PAID", "Paid"
        OVERDUE = "OVERDUE", "Overdue"
        VOID = "VOID", "Void"

    job = models.ForeignKey(Job, null=True, blank=True, on_delete=models.SET_NULL, related_name="invoices")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="invoices")
    estimate = models.ForeignKey(
        Estimate, null=True, blank=True, on_delete=models.SET_NULL, related_name="invoices"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    line_items = models.JSONField(
        default=list,
        help_text='[{"description": "...", "qty": 1, "unit_price": "50.00"}, ...]',
    )
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    # Stripe
    stripe_checkout_session_id = models.CharField(max_length=255, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Invoice #{self.pk} — {self.customer.name} — ${self.total}"

    def recalculate_total(self):
        from decimal import Decimal

        subtotal = Decimal("0")
        for item in self.line_items or []:
            qty = Decimal(str(item.get("qty", 1)))
            price = Decimal(str(item.get("unit_price", 0)))
            subtotal += qty * price
        self.tax_amount = (subtotal * self.tax_rate).quantize(Decimal("0.01"))
        self.total = subtotal + self.tax_amount


class Expense(models.Model):
    """Operator expense tracking."""

    class Category(models.TextChoices):
        MATERIALS = "MATERIALS", "Materials"
        TOOLS = "TOOLS", "Tools"
        FUEL = "FUEL", "Fuel"
        SUBCONTRACTOR = "SUBCONTRACTOR", "Subcontractor"
        OTHER = "OTHER", "Other"

    job = models.ForeignKey(Job, null=True, blank=True, on_delete=models.SET_NULL, related_name="expenses")
    description = models.CharField(max_length=300)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.MATERIALS)
    receipt_photo_url = models.URLField(blank=True)
    date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.description} — ${self.amount}"


class SupplyItem(models.Model):
    """Supplies checklist with reorder flag."""

    name = models.CharField(max_length=200)
    quantity_on_hand = models.PositiveIntegerField(default=0)
    reorder_threshold = models.PositiveIntegerField(default=5)
    reorder_flag = models.BooleanField(default=False)
    unit = models.CharField(max_length=30, blank=True, help_text="e.g. box, roll, each")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        flag = " [REORDER]" if self.reorder_flag else ""
        return f"{self.name} ({self.quantity_on_hand} {self.unit}){flag}"

    def save(self, *args, **kwargs):
        # Auto-set reorder flag based on threshold
        if self.quantity_on_hand <= self.reorder_threshold:
            self.reorder_flag = True
        super().save(*args, **kwargs)
