from django.contrib import admin
from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "phone",
        "date_of_birth",
        "created_at",
    )

    search_fields = (
        "user__email",
        "user__first_name",
        "user__last_name",
        "phone",
    )

    list_filter = (
        "created_at",
    )

    ordering = ("-created_at",)