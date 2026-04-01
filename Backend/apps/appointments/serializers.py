from rest_framework import serializers
from django.utils import timezone

from .models import Appointment, SoapNote, Notification
from apps.availability.models import AvailabilityRule


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


class AppointmentSerializer(serializers.ModelSerializer):
    # Patient
    patient_email = serializers.EmailField(source="patient.user.email", read_only=True)
    patient_first_name = serializers.CharField(
        source="patient.user.first_name",
        read_only=True,
    )
    patient_last_name = serializers.CharField(
        source="patient.user.last_name",
        read_only=True,
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

    # Note SOAP liée au rendez-vous
    soap_note = serializers.SerializerMethodField()

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
            "soap_note",
        )
        read_only_fields = ("id", "created_at", "soap_note")

    def get_soap_note(self, obj):
        soap_note = getattr(obj, "soap_note", None)

        if not soap_note:
            return None

        return SoapNoteSerializer(soap_note).data


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
        extra_kwargs = {
            "patient": {"required": False},
            "status": {"required": False},
        }

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        start_time = attrs.get("start_time")
        end_time = attrs.get("end_time")
        practitioner = attrs.get("practitioner")
        appointment_date = attrs.get("appointment_date")

        # Sécuriser le patient selon le rôle
        if user and getattr(user, "role", None) == "PATIENT":
            if not hasattr(user, "patient_profile"):
                raise serializers.ValidationError(
                    {"detail": "Aucun profil patient associé à cet utilisateur."}
                )
            attrs["patient"] = user.patient_profile

        # Valeur par défaut du statut
        if not attrs.get("status"):
            attrs["status"] = Appointment.Status.PENDING

        # Vérifier les champs nécessaires
        if not all([start_time, end_time, practitioner, appointment_date]):
            return attrs

        # Empêcher un rendez-vous dans le passé
        today = timezone.localdate()
        if appointment_date < today:
            raise serializers.ValidationError(
                {"appointment_date": "Impossible de réserver dans le passé."}
            )

        # Vérifier cohérence horaire
        if start_time >= end_time:
            raise serializers.ValidationError(
                {"end_time": "L'heure de fin doit être après l'heure de début."}
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

        # Vérifier conflits avec autres rendez-vous non annulés
        overlapping = Appointment.objects.filter(
            practitioner=practitioner,
            appointment_date=appointment_date,
            start_time__lt=end_time,
            end_time__gt=start_time,
        ).exclude(status=Appointment.Status.CANCELLED)

        if self.instance:
            overlapping = overlapping.exclude(pk=self.instance.pk)

        if overlapping.exists():
            raise serializers.ValidationError(
                {"detail": "Ce créneau est déjà occupé pour ce praticien."}
            )

        return attrs


class AppointmentStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ("status",)

    def validate_status(self, value):
        allowed_statuses = {
            Appointment.Status.PENDING,
            Appointment.Status.CONFIRMED,
            Appointment.Status.CANCELLED,
            Appointment.Status.COMPLETED,
        }

        if value not in allowed_statuses:
            raise serializers.ValidationError("Statut de rendez-vous invalide.")

        return value