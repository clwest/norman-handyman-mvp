"""Public booking intake."""

from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from handyman.core.models import BookingRequest


# Disable the tight per-scope throttle so tests can hit the endpoint back-to-back.
@override_settings(
    REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": [
            "rest_framework.authentication.SessionAuthentication",
            "rest_framework.authentication.TokenAuthentication",
        ],
        "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
        "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
        "PAGE_SIZE": 25,
    }
)
class PublicBookingTests(APITestCase):
    url = "/api/booking-requests/public/"

    def test_anonymous_can_submit_booking(self):
        payload = {
            "customer_name": "Jane Homeowner",
            "customer_email": "jane@example.com",
            "customer_phone": "405-555-0100",
            "customer_address": "1 Main St, Norman, OK",
            "description": "Front porch light not working; think the fixture is bad.",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BookingRequest.objects.count(), 1)
        booking = BookingRequest.objects.get()
        self.assertEqual(booking.customer_name, "Jane Homeowner")
        self.assertEqual(booking.status, BookingRequest.Status.NEW)

    def test_missing_required_fields_rejected(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(BookingRequest.objects.count(), 0)

    def test_anonymous_cannot_list_all_bookings_through_operator_endpoint(self):
        BookingRequest.objects.create(
            customer_name="A",
            customer_email="a@example.com",
            customer_phone="405-555-0111",
            description="test",
        )
        response = self.client.get("/api/booking-requests/")
        self.assertIn(response.status_code, {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN})
