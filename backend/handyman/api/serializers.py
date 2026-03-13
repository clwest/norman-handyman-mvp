from rest_framework import serializers

from handyman.core.models import (
    BookingRequest,
    Customer,
    Estimate,
    Expense,
    Invoice,
    Job,
    SupplyItem,
)


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")


class BookingRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingRequest
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")


class BookingRequestPublicSerializer(serializers.ModelSerializer):
    """Public serializer — no status/customer FK exposed."""

    class Meta:
        model = BookingRequest
        fields = (
            "id",
            "customer_name",
            "customer_email",
            "customer_phone",
            "customer_address",
            "description",
            "preferred_date",
            "photo_urls",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class JobSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = Job
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")


class EstimateSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = Estimate
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "total")

    def create(self, validated_data):
        instance = super().create(validated_data)
        instance.recalculate_total()
        instance.save(update_fields=["total"])
        return instance

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        instance.recalculate_total()
        instance.save(update_fields=["total"])
        return instance


class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = (
            "created_at",
            "updated_at",
            "total",
            "tax_amount",
            "stripe_checkout_session_id",
            "stripe_payment_intent_id",
            "paid_at",
        )

    def create(self, validated_data):
        instance = super().create(validated_data)
        instance.recalculate_total()
        instance.save(update_fields=["total", "tax_amount"])
        return instance

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        instance.recalculate_total()
        instance.save(update_fields=["total", "tax_amount"])
        return instance


class InvoicePublicSerializer(serializers.ModelSerializer):
    """Public view — customer sees total, status, line items, but not internal fields."""

    class Meta:
        model = Invoice
        fields = (
            "id",
            "status",
            "line_items",
            "total",
            "tax_amount",
            "due_date",
            "notes",
            "created_at",
        )


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")


class SupplyItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplyItem
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")
