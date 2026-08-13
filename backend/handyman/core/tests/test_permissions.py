"""Operator endpoints must require authentication; public endpoints must not."""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from handyman.core.models import Customer, Invoice


OPERATOR_URLS = [
    "/api/customers/",
    "/api/booking-requests/",
    "/api/jobs/",
    "/api/estimates/",
    "/api/invoices/",
    "/api/expenses/",
    "/api/supplies/",
]


class OperatorAuthTests(APITestCase):
    def test_all_operator_endpoints_reject_anonymous(self):
        for url in OPERATOR_URLS:
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertIn(
                    response.status_code,
                    {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN},
                    f"{url} should not be reachable without auth",
                )

    def test_authenticated_operator_can_list(self):
        user = get_user_model().objects.create_user(username="op", password="x")
        self.client.force_authenticate(user=user)
        for url in OPERATOR_URLS:
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, status.HTTP_200_OK, url)


class PublicInvoiceViewTests(APITestCase):
    def test_anonymous_can_view_public_invoice(self):
        customer = Customer.objects.create(name="Sam", email="sam@example.com")
        invoice = Invoice.objects.create(
            customer=customer,
            line_items=[{"description": "Fix sink", "qty": 1, "unit_price": "150.00"}],
            total="150.00",
        )
        response = self.client.get(f"/api/invoices/public/{invoice.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Public serializer must not leak internal Stripe identifiers.
        self.assertNotIn("stripe_checkout_session_id", response.json())
        self.assertNotIn("stripe_payment_intent_id", response.json())
