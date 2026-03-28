from django.contrib import admin
from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "duration_minutes",
        "price",
        "is_active",
        "created_at",
    )

    search_fields = (
        "name",
        "description",
    )

    list_filter = (
        "is_active",
        "duration_minutes",
    )

    ordering = ("name",)