from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()

# Public endpoints
router.register(r"booking-requests/public", views.BookingRequestPublicViewSet, basename="booking-request-public")
router.register(r"invoices/public", views.InvoicePublicViewSet, basename="invoice-public")

# Operator endpoints (auth required)
router.register(r"customers", views.CustomerViewSet)
router.register(r"booking-requests", views.BookingRequestViewSet)
router.register(r"jobs", views.JobViewSet)
router.register(r"estimates", views.EstimateViewSet)
router.register(r"invoices", views.InvoiceViewSet)
router.register(r"expenses", views.ExpenseViewSet)
router.register(r"supplies", views.SupplyItemViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("webhooks/stripe/", views.stripe_webhook, name="stripe-webhook"),
]
