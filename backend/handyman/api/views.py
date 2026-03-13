"""Norman Handyman MVP — API Views."""

import json
import logging

import stripe
from django.conf import settings
from handyman.core.emails import (
    send_booking_confirmation,
    send_estimate_email,
    send_invoice_email,
    send_payment_confirmation,
)
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from handyman.core.models import (
    BookingRequest,
    Customer,
    Estimate,
    Expense,
    Invoice,
    Job,
    SupplyItem,
)

from .serializers import (
    BookingRequestPublicSerializer,
    BookingRequestSerializer,
    CustomerSerializer,
    EstimateSerializer,
    ExpenseSerializer,
    InvoicePublicSerializer,
    InvoiceSerializer,
    JobSerializer,
    SupplyItemSerializer,
)

logger = logging.getLogger(__name__)


# ── Public endpoints (no auth) ───────────────────────────────────────────


class BookingRequestPublicViewSet(viewsets.GenericViewSet):
    """Public endpoint for customers to submit booking requests."""

    permission_classes = [permissions.AllowAny]
    serializer_class = BookingRequestPublicSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "booking"

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        send_booking_confirmation(booking)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InvoicePublicViewSet(viewsets.GenericViewSet):
    """Public endpoint for customers to view invoices."""

    permission_classes = [permissions.AllowAny]
    serializer_class = InvoicePublicSerializer
    queryset = Invoice.objects.all()

    def retrieve(self, request, pk=None):
        try:
            invoice = self.get_queryset().get(pk=pk)
        except Invoice.DoesNotExist:
            return Response({"error": "Invoice not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def pay(self, request, pk=None):
        """Public endpoint: create a Stripe Checkout session for an invoice."""
        try:
            invoice = self.get_queryset().get(pk=pk)
        except Invoice.DoesNotExist:
            return Response({"error": "Invoice not found"}, status=status.HTTP_404_NOT_FOUND)

        if invoice.status == Invoice.Status.PAID:
            return Response({"error": "Invoice already paid"}, status=status.HTTP_400_BAD_REQUEST)

        if not settings.STRIPE_SECRET_KEY:
            return Response({"error": "Stripe not configured"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        stripe.api_key = settings.STRIPE_SECRET_KEY

        line_items = []
        for item in invoice.line_items or []:
            line_items.append({
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": item.get("description", "Service")},
                    "unit_amount": int(float(item.get("unit_price", 0)) * 100),
                },
                "quantity": item.get("qty", 1),
            })
        if invoice.tax_amount > 0:
            line_items.append({
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": "Tax"},
                    "unit_amount": int(invoice.tax_amount * 100),
                },
                "quantity": 1,
            })

        success_url = request.build_absolute_uri(f"/pay/{invoice.pk}?paid=1")
        cancel_url = request.build_absolute_uri(f"/pay/{invoice.pk}")

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=line_items,
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={"invoice_id": str(invoice.pk)},
            )
        except stripe.error.StripeError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        invoice.stripe_checkout_session_id = session.id
        invoice.save(update_fields=["stripe_checkout_session_id", "updated_at"])

        return Response({"checkout_url": session.url})


# ── Operator endpoints (auth required) ────────────────────────────────────


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer


class BookingRequestViewSet(viewsets.ModelViewSet):
    queryset = BookingRequest.objects.all()
    serializer_class = BookingRequestSerializer
    filterset_fields = ["status"]

    @action(detail=True, methods=["post"])
    def convert_to_job(self, request, pk=None):
        """Convert a booking request into a Job + Customer."""
        booking = self.get_object()

        # Find or create customer
        customer, _ = Customer.objects.get_or_create(
            email=booking.customer_email,
            defaults={
                "name": booking.customer_name,
                "phone": booking.customer_phone,
                "address": booking.customer_address,
            },
        )

        # Link customer to booking
        booking.customer = customer
        booking.status = BookingRequest.Status.SCHEDULED
        booking.save(update_fields=["customer", "status", "updated_at"])

        # Create job
        job = Job.objects.create(
            customer=customer,
            booking_request=booking,
            title=booking.description[:300],
            description=booking.description,
            scheduled_date=booking.preferred_date,
        )

        return Response(JobSerializer(job).data, status=status.HTTP_201_CREATED)


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.select_related("customer").all()
    serializer_class = JobSerializer
    filterset_fields = ["status", "customer"]

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        job = self.get_object()
        job.status = Job.Status.IN_PROGRESS
        job.save(update_fields=["status", "updated_at"])
        return Response(JobSerializer(job).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        job = self.get_object()
        job.status = Job.Status.COMPLETED
        job.completed_at = timezone.now()
        job.save(update_fields=["status", "completed_at", "updated_at"])
        return Response(JobSerializer(job).data)


class EstimateViewSet(viewsets.ModelViewSet):
    queryset = Estimate.objects.select_related("customer", "job").all()
    serializer_class = EstimateSerializer
    filterset_fields = ["status", "job", "customer"]

    @action(detail=True, methods=["post"])
    def send_estimate(self, request, pk=None):
        estimate = self.get_object()
        estimate.status = Estimate.Status.SENT
        estimate.sent_at = timezone.now()
        estimate.save(update_fields=["status", "sent_at", "updated_at"])
        send_estimate_email(estimate)
        return Response(EstimateSerializer(estimate).data)


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("customer", "job").all()
    serializer_class = InvoiceSerializer
    filterset_fields = ["status", "job", "customer"]

    @action(detail=True, methods=["post"])
    def send_invoice(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = Invoice.Status.SENT
        invoice.sent_at = timezone.now()
        invoice.save(update_fields=["status", "sent_at", "updated_at"])
        send_invoice_email(invoice)
        return Response(InvoiceSerializer(invoice).data)

    @action(detail=True, methods=["post"])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = Invoice.Status.PAID
        invoice.paid_at = timezone.now()
        invoice.save(update_fields=["status", "paid_at", "updated_at"])
        return Response(InvoiceSerializer(invoice).data)

    @action(detail=True, methods=["post"])
    def create_checkout(self, request, pk=None):
        """Create a Stripe Checkout session for this invoice."""
        invoice = self.get_object()

        if not settings.STRIPE_SECRET_KEY:
            return Response(
                {"error": "Stripe not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        stripe.api_key = settings.STRIPE_SECRET_KEY

        line_items = []
        for item in invoice.line_items or []:
            line_items.append(
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {"name": item.get("description", "Service")},
                        "unit_amount": int(float(item.get("unit_price", 0)) * 100),
                    },
                    "quantity": item.get("qty", 1),
                }
            )

        # Add tax as a line item if present
        if invoice.tax_amount > 0:
            line_items.append(
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {"name": "Tax"},
                        "unit_amount": int(invoice.tax_amount * 100),
                    },
                    "quantity": 1,
                }
            )

        success_url = request.build_absolute_uri(f"/pay/{invoice.pk}/success")
        cancel_url = request.build_absolute_uri(f"/pay/{invoice.pk}")

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=line_items,
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={"invoice_id": str(invoice.pk)},
            )
        except stripe.error.StripeError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        invoice.stripe_checkout_session_id = session.id
        invoice.save(update_fields=["stripe_checkout_session_id", "updated_at"])

        return Response({"checkout_url": session.url, "session_id": session.id})


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    filterset_fields = ["category", "job"]


class SupplyItemViewSet(viewsets.ModelViewSet):
    queryset = SupplyItem.objects.all()
    serializer_class = SupplyItemSerializer
    filterset_fields = ["reorder_flag"]


# ── Stripe Webhook ────────────────────────────────────────────────────────


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """Handle Stripe webhook events."""
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.warning("Stripe webhook secret not configured")
        return HttpResponse(status=400)

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        logger.error("Invalid Stripe webhook payload")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid Stripe webhook signature")
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        invoice_id = session.get("metadata", {}).get("invoice_id")

        if invoice_id:
            try:
                invoice = Invoice.objects.get(pk=invoice_id)
                invoice.status = Invoice.Status.PAID
                invoice.stripe_payment_intent_id = session.get("payment_intent", "")
                invoice.paid_at = timezone.now()
                invoice.save(
                    update_fields=["status", "stripe_payment_intent_id", "paid_at", "updated_at"]
                )
                logger.info("Invoice %s marked PAID via Stripe webhook", invoice_id)
                send_payment_confirmation(invoice)
            except Invoice.DoesNotExist:
                logger.error("Invoice %s not found for Stripe webhook", invoice_id)

    return HttpResponse(status=200)
