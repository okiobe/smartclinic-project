from rest_framework import serializers
from django.utils import timezone

from .models import Appointment, SoapNote, Notification
from apps.availability.models import AvailabilityRule


class AppointmentSerializer(serializers.ModelSerializer):
    # Patient
    patient_email = serializers.EmailField(source="patient.user.email", read_only=True)
    patient_first_name = serializers.CharField(
        source="patient.user.first_name", read_only=True
    )
    patient_last_name = serializers.CharField(
        source="patient.user.last_name", read_only=True
    )

    # Praticien
    practitioner_email = serializers.EmailField(
        source="practitioner.user.email",
        read_only=True,
    )
    practitioner_first_name = serializers.CharField(
        source="practitioner.user.first_name",
        read_only=True,
    )
    practitioner_last_name = serializers.CharField(
        source="practitioner.user.last_name",
        read_only=True,
    )

    # Service
    service_name = serializers.CharField(source="service.name", read_only=True)

    class Meta:
        model = Appointment
        fields = (
            "id",

            "patient",
            "patient_email",
            "patient_first_name",
            "patient_last_name",

            "practitioner",
            "practitioner_email",
            "practitioner_first_name",
            "practitioner_last_name",

            "service",
            "service_name",

            "appointment_date",
            "start_time",
            "end_time",
            "status",
            "reason",
            "created_at",
        )
        read_only_fields = ("id", "created_at")




class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = (
            "patient",
            "practitioner",
            "service",
            "appointment_date",
            "start_time",
            "end_time",
            "status",
            "reason",
        )

    def validate(self, attrs):
        start_time = attrs.get("start_time")
        end_time = attrs.get("end_time")
        practitioner = attrs.get("practitioner")
        appointment_date = attrs.get("appointment_date")

        # Vérifier les champs obligatoires
        if not all([start_time, end_time, practitioner, appointment_date]):
            return attrs

        # Vérifier cohérence horaire
        if start_time >= end_time:
            raise serializers.ValidationError(
                {"end_time": "L'heure de fin doit être après l'heure de début."}
            )

        # Empêcher les rendez-vous dans le passé
        if appointment_date < timezone.now().date():
            raise serializers.ValidationError(
                {"appointment_date": "Impossible de réserver dans le passé."}
            )

        # Vérifier disponibilité du praticien
        weekday = appointment_date.isoweekday()

        availability = AvailabilityRule.objects.filter(
            practitioner=practitioner,
            weekday=weekday,
            start_time__lte=start_time,
            end_time__gte=end_time,
            is_active=True,
        )

        if not availability.exists():
            raise serializers.ValidationError(
                {"detail": "Le praticien n'est pas disponible sur ce créneau."}
            )

        # Vérifier conflits avec autres rendez-vous
        overlapping = Appointment.objects.filter(
            practitioner=practitioner,
            appointment_date=appointment_date,
            start_time__lt=end_time,
            end_time__gt=start_time,
        )

        if self.instance:
            overlapping = overlapping.exclude(pk=self.instance.pk)

        if overlapping.exists():
            raise serializers.ValidationError(
                {"detail": "Ce créneau est déjà occupé pour ce praticien."}
            )

        return attrs


class SoapNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoapNote
        fields = (
            "id",
            "appointment",
            "subjective",
            "objective",
            "assessment",
            "plan",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            "id",
            "appointment",
            "type",
            "message",
            "is_sent",
            "sent_at",
            "created_at",
        )
        read_only_fields = ("id", "created_at")