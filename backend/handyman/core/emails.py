"""Email notification stubs — logs in dev, sends in prod."""

import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_booking_confirmation(booking_request):
    """Notify customer that their booking request was received."""
    if not booking_request.customer_email:
        logger.info("Booking #%s: no email to send confirmation to", booking_request.pk)
        return

    subject = f"We received your request — {settings.DEFAULT_FROM_EMAIL.split('@')[0]}"
    body = (
        f"Hi {booking_request.customer_name},\n\n"
        f"Thank you for reaching out! We received your request:\n\n"
        f'"{booking_request.description[:200]}"\n\n'
        f"We'll review the details and contact you within one business day "
        f"to confirm your appointment.\n\n"
        f"If you have questions, reply to this email or call us.\n\n"
        f"— Norman Handyman Services"
    )

    logger.info("Sending booking confirmation to %s for request #%s",
                booking_request.customer_email, booking_request.pk)
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [booking_request.customer_email])


def send_estimate_email(estimate):
    """Send estimate to customer."""
    email = estimate.customer.email
    if not email:
        logger.info("Estimate #%s: customer has no email", estimate.pk)
        return

    subject = f"Your estimate from Norman Handyman Services — ${estimate.total}"
    lines = []
    for item in estimate.line_items or []:
        lines.append(f"  - {item['description']}: {item.get('qty', 1)} x ${item['unit_price']}")

    body = (
        f"Hi {estimate.customer.name},\n\n"
        f"Here's your estimate for the work we discussed:\n\n"
        + "\n".join(lines) + "\n\n"
        f"Estimated total: ${estimate.total}\n\n"
        f"{estimate.notes}\n\n"
        f"If this looks good, let us know and we'll schedule the work.\n\n"
        f"— Norman Handyman Services"
    )

    logger.info("Sending estimate #%s to %s", estimate.pk, email)
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [email])


def send_invoice_email(invoice, checkout_url=None):
    """Send invoice to customer with optional payment link."""
    email = invoice.customer.email
    if not email:
        logger.info("Invoice #%s: customer has no email", invoice.pk)
        return

    subject = f"Invoice from Norman Handyman Services — ${invoice.total}"
    lines = []
    for item in invoice.line_items or []:
        lines.append(f"  - {item['description']}: {item.get('qty', 1)} x ${item['unit_price']}")

    pay_section = ""
    if checkout_url:
        pay_section = f"\nPay online: {checkout_url}\n"

    body = (
        f"Hi {invoice.customer.name},\n\n"
        f"Here's your invoice for the completed work:\n\n"
        + "\n".join(lines) + "\n\n"
        f"Total: ${invoice.total}\n"
        + pay_section + "\n"
        f"{invoice.notes}\n\n"
        f"Thank you for choosing Norman Handyman Services!\n"
    )

    logger.info("Sending invoice #%s to %s", invoice.pk, email)
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [email])


def send_payment_confirmation(invoice):
    """Notify customer that payment was received."""
    email = invoice.customer.email
    if not email:
        logger.info("Invoice #%s: customer has no email for payment confirmation", invoice.pk)
        return

    subject = f"Payment received — Invoice #{invoice.pk}"
    body = (
        f"Hi {invoice.customer.name},\n\n"
        f"We received your payment of ${invoice.total} for Invoice #{invoice.pk}.\n\n"
        f"Thank you for your business! If you need anything else, "
        f"don't hesitate to reach out.\n\n"
        f"— Norman Handyman Services"
    )

    logger.info("Sending payment confirmation for invoice #%s to %s", invoice.pk, email)
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [email])
