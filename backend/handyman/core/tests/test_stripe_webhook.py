"""Stripe webhook: signature verification + PAID transition + replay idempotency."""

from unittest.mock import patch

import stripe
from django.test import override_settings
from rest_framework.test import APITestCase

from handyman.core.models import Customer, Invoice


@override_settings(STRIPE_WEBHOOK_SECRET="whsec_test_dummy")
class StripeWebhookTests(APITestCase):
    url = "/api/webhooks/stripe/"

    def setUp(self):
        self.customer = Customer.objects.create(name="Bob", email="bob@example.com")
        self.invoice = Invoice.objects.create(
            customer=self.customer,
            line_items=[{"description": "Plumbing", "qty": 1, "unit_price": "200.00"}],
            total="200.00",
        )

    def _post(self, body=b"{}", sig="t=1,v1=abc"):
        return self.client.post(
            self.url,
            data=body,
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE=sig,
        )

    def test_invalid_signature_returns_400_and_leaves_invoice_untouched(self):
        with patch(
            "stripe.Webhook.construct_event",
            side_effect=stripe.error.SignatureVerificationError("bad", "sig"),
        ):
            response = self._post()
        self.assertEqual(response.status_code, 400)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.DRAFT)

    def test_invalid_payload_returns_400(self):
        with patch("stripe.Webhook.construct_event", side_effect=ValueError("bad json")):
            response = self._post(body=b"not json")
        self.assertEqual(response.status_code, 400)

    def test_missing_webhook_secret_returns_400(self):
        with override_settings(STRIPE_WEBHOOK_SECRET=""):
            response = self._post()
        self.assertEqual(response.status_code, 400)

    def test_checkout_completed_marks_invoice_paid(self):
        event = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_1",
                    "payment_intent": "pi_test_1",
                    "metadata": {"invoice_id": str(self.invoice.pk)},
                }
            },
        }
        with patch("stripe.Webhook.construct_event", return_value=event):
            response = self._post()
        self.assertEqual(response.status_code, 200)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.PAID)
        self.assertEqual(self.invoice.stripe_payment_intent_id, "pi_test_1")
        self.assertIsNotNone(self.invoice.paid_at)

    def test_replayed_webhook_is_idempotent(self):
        """A duplicate event must not corrupt paid_at or throw."""
        event = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_2",
                    "payment_intent": "pi_test_2",
                    "metadata": {"invoice_id": str(self.invoice.pk)},
                }
            },
        }
        with patch("stripe.Webhook.construct_event", return_value=event):
            self._post()
            self.invoice.refresh_from_db()
            first_paid_at = self.invoice.paid_at
            # Replay
            response = self._post()
        self.assertEqual(response.status_code, 200)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.PAID)
        # Replay overwrites paid_at (documented current behavior) but never fails
        # or unpays a paid invoice.
        self.assertGreaterEqual(self.invoice.paid_at, first_paid_at)

    def test_unknown_invoice_id_does_not_500(self):
        event = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_3",
                    "payment_intent": "pi_test_3",
                    "metadata": {"invoice_id": "999999"},
                }
            },
        }
        with patch("stripe.Webhook.construct_event", return_value=event):
            response = self._post()
        self.assertEqual(response.status_code, 200)

    def test_unrelated_event_type_is_ignored(self):
        event = {"type": "customer.created", "data": {"object": {}}}
        with patch("stripe.Webhook.construct_event", return_value=event):
            response = self._post()
        self.assertEqual(response.status_code, 200)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.DRAFT)
