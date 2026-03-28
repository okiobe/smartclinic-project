from django.contrib import admin
from .models import AvailabilityRule


@admin.register(AvailabilityRule)
class AvailabilityRuleAdmin(admin.ModelAdmin):

    list_display = (
        "practitioner",
        "weekday",
        "start_time",
        "end_time",
        "is_active",
    )

    list_filter = (
        "weekday",
        "is_active",
    )

    search_fields = (
        "practitioner__user__email",
        "practitioner__user__first_name",
        "practitioner__user__last_name",
    )

    ordering = ("practitioner", "weekday", "start_time")