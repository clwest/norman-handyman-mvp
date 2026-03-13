from django.contrib import admin

from .models import BookingRequest, Customer, Estimate, Expense, Invoice, Job, SupplyItem


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "phone", "created_at")
    search_fields = ("name", "email", "phone")


@admin.register(BookingRequest)
class BookingRequestAdmin(admin.ModelAdmin):
    list_display = ("customer_name", "status", "preferred_date", "created_at")
    list_filter = ("status",)
    search_fields = ("customer_name", "description")


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("title", "customer", "status", "scheduled_date", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "description")


@admin.register(Estimate)
class EstimateAdmin(admin.ModelAdmin):
    list_display = ("pk", "customer", "job", "status", "total", "created_at")
    list_filter = ("status",)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("pk", "customer", "status", "total", "due_date", "paid_at")
    list_filter = ("status",)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("description", "amount", "category", "date", "job")
    list_filter = ("category",)


@admin.register(SupplyItem)
class SupplyItemAdmin(admin.ModelAdmin):
    list_display = ("name", "quantity_on_hand", "reorder_threshold", "reorder_flag")
    list_filter = ("reorder_flag",)
