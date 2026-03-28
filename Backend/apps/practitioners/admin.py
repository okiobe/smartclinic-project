from django.contrib import admin
from .models import Practitioner, PractitionerService


@admin.register(Practitioner)
class PractitionerAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "specialty",
        "clinic_name",
        "phone",
        "created_at",
    )

    search_fields = (
        "user__email",
        "user__first_name",
        "user__last_name",
        "specialty",
        "clinic_name",
        "phone",
    )

    list_filter = (
        "specialty",
        "created_at",
    )

    ordering = ("-created_at",)


@admin.register(PractitionerService)
class PractitionerServiceAdmin(admin.ModelAdmin):
    list_display = (
        "practitioner",
        "service",
    )

    search_fields = (
        "practitioner__user__email",
        "service__name",
    )

    ordering = ("practitioner", "service")