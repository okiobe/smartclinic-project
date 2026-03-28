from django.contrib import admin
from .models import Appointment, SoapNote, Notification


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "patient",
        "practitioner",
        "service",
        "appointment_date",
        "start_time",
        "status",
    )

    list_filter = (
        "status",
        "appointment_date",
        "service",
    )

    search_fields = (
        "patient__user__email",
        "practitioner__user__email",
        "service__name",
    )

    ordering = ("-appointment_date", "start_time")


@admin.register(SoapNote)
class SoapNoteAdmin(admin.ModelAdmin):

    list_display = (
        "appointment",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "appointment__patient__user__email",
        "appointment__practitioner__user__email",
    )

    ordering = ("-created_at",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "appointment",
        "type",
        "is_sent",
        "sent_at",
        "created_at",
    )

    list_filter = (
        "type",
        "is_sent",
    )

    search_fields = (
        "appointment__patient__user__email",
        "appointment__practitioner__user__email",
        "message",
    )

    ordering = ("-created_at",)