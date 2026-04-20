from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .ai_service import generate_soap_from_notes
from .audio_service import transcribe_audio_file
from apps.audit.utils import log_audit_event
from .models import Appointment
from .serializers import (
    AppointmentSerializer,
    AppointmentCreateSerializer,
    SoapNoteSerializer,
)
from .reminders import (
    send_booking_notifications,
    notify_practitioner_patient_cancelled,
    notify_patient_practitioner_cancelled,
    notify_patient_appointment_confirmed,
    notify_patient_soap_note_created,
)


class AppointmentAccessMixin:
    def get_scoped_queryset(self):
        user = self.request.user

        queryset = Appointment.objects.select_related(
            "patient__user",
            "practitioner__user",
            "service",
            "soap_note",
        )

        if getattr(user, "role", None) == "PATIENT":
            if hasattr(user, "patient_profile"):
                return queryset.filter(patient=user.patient_profile)
            return Appointment.objects.none()

        if getattr(user, "role", None) == "PRACTITIONER":
            if hasattr(user, "practitioner_profile"):
                return queryset.filter(practitioner=user.practitioner_profile)
            return Appointment.objects.none()

        if getattr(user, "role", None) == "ADMIN":
            return queryset

        return Appointment.objects.none()


class AppointmentListCreateView(AppointmentAccessMixin, generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = self.get_scoped_queryset()

        patient_id = self.request.query_params.get("patient")
        practitioner_id = self.request.query_params.get("practitioner")
        appointment_date = self.request.query_params.get("date")

        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        if practitioner_id:
            queryset = queryset.filter(practitioner_id=practitioner_id)

        if appointment_date:
            queryset = queryset.filter(appointment_date=appointment_date)

        return queryset.order_by("appointment_date", "start_time")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def perform_create(self, serializer):
        appointment = serializer.save()

        log_audit_event(
            user=self.request.user,
            action="CREATE",
            module="appointments",
            object_type="Appointment",
            object_id=appointment.id,
            description=(
                f"Création du rendez-vous #{appointment.id} pour "
                f"{appointment.patient.user.first_name} {appointment.patient.user.last_name} "
                f"avec {appointment.practitioner.user.first_name} {appointment.practitioner.user.last_name} "
                f"le {appointment.appointment_date} à {appointment.start_time}."
            ),
        )

        if getattr(self.request.user, "role", None) == "PATIENT":
            send_booking_notifications(appointment)


class AppointmentDetailView(AppointmentAccessMixin, generics.RetrieveAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.get_scoped_queryset()


class AppointmentStatusUpdateView(AppointmentAccessMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        appointment = self.get_scoped_queryset().filter(pk=pk).first()

        if not appointment:
            return Response(
                {"detail": "Rendez-vous introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if getattr(request.user, "role", None) not in {"PRACTITIONER", "ADMIN"}:
            return Response(
                {"detail": "Seul le praticien ou l'administrateur peut modifier ce statut."},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_status = request.data.get("status")
        allowed_statuses = {"PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"}

        if new_status not in allowed_statuses:
            return Response(
                {"detail": "Statut invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = appointment.status
        appointment.status = new_status

        update_fields = ["status"]

        if new_status == Appointment.Status.COMPLETED:
            appointment.completed_at = timezone.now()
            appointment.soap_note_reminder_last_sent_at = None
            update_fields.extend(["completed_at", "soap_note_reminder_last_sent_at"])
        elif old_status == Appointment.Status.COMPLETED and new_status != Appointment.Status.COMPLETED:
            appointment.completed_at = None
            appointment.soap_note_reminder_last_sent_at = None
            update_fields.extend(["completed_at", "soap_note_reminder_last_sent_at"])

        appointment.save(update_fields=update_fields)

        log_audit_event(
            user=request.user,
            action="STATUS_CHANGE",
            module="appointments",
            object_type="Appointment",
            object_id=appointment.id,
            description=(
                f"Changement de statut du rendez-vous #{appointment.id} : "
                f"{old_status} -> {new_status}."
            ),
        )

        if old_status != Appointment.Status.CONFIRMED and new_status == Appointment.Status.CONFIRMED:
            notify_patient_appointment_confirmed(appointment)

        if new_status == Appointment.Status.CANCELLED and getattr(request.user, "role", None) == "PRACTITIONER":
            notify_patient_practitioner_cancelled(appointment)

        return Response(
            AppointmentSerializer(appointment).data,
            status=status.HTTP_200_OK,
        )


class AppointmentCancelView(AppointmentAccessMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        appointment = self.get_scoped_queryset().filter(pk=pk).first()

        if not appointment:
            return Response(
                {"detail": "Rendez-vous introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if appointment.status not in {"PENDING", "CONFIRMED"}:
            return Response(
                {"detail": "Ce rendez-vous ne peut plus être annulé."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        actor_role = getattr(request.user, "role", None)

        appointment.status = "CANCELLED"
        appointment.save(update_fields=["status"])

        log_audit_event(
            user=request.user,
            action="CANCEL",
            module="appointments",
            object_type="Appointment",
            object_id=appointment.id,
            description=f"Annulation du rendez-vous #{appointment.id}.",
        )

        if actor_role == "PATIENT":
            notify_practitioner_patient_cancelled(appointment)
        elif actor_role == "PRACTITIONER":
            notify_patient_practitioner_cancelled(appointment)

        return Response(
            AppointmentSerializer(appointment).data,
            status=status.HTTP_200_OK,
        )


class AppointmentSoapNoteView(AppointmentAccessMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_appointment(self, pk):
        return self.get_scoped_queryset().filter(pk=pk).first()

    def get(self, request, pk):
        appointment = self.get_appointment(pk)

        if not appointment:
            return Response(
                {"detail": "Rendez-vous introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        soap_note = getattr(appointment, "soap_note", None)

        if not soap_note:
            return Response(
                {"detail": "Aucune note SOAP pour ce rendez-vous."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(SoapNoteSerializer(soap_note).data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        appointment = self.get_appointment(pk)

        if not appointment:
            return Response(
                {"detail": "Rendez-vous introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if getattr(request.user, "role", None) != "PRACTITIONER":
            return Response(
                {"detail": "Seul le praticien peut rédiger une note SOAP."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if getattr(appointment, "soap_note", None):
            return Response(
                {"detail": "Une note SOAP existe déjà pour ce rendez-vous."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SoapNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        soap_note = serializer.save(appointment=appointment)

        appointment.soap_note_reminder_last_sent_at = None
        appointment.save(update_fields=["soap_note_reminder_last_sent_at"])

        log_audit_event(
            user=request.user,
            action="CREATE",
            module="soap",
            object_type="SoapNote",
            object_id=soap_note.id,
            description=f"Création d'une note SOAP pour le rendez-vous #{appointment.id}.",
        )

        notify_patient_soap_note_created(appointment)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        appointment = self.get_appointment(pk)

        if not appointment:
            return Response(
                {"detail": "Rendez-vous introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if getattr(request.user, "role", None) != "PRACTITIONER":
            return Response(
                {"detail": "Seul le praticien peut modifier une note SOAP."},
                status=status.HTTP_403_FORBIDDEN,
            )

        soap_note = getattr(appointment, "soap_note", None)

        if not soap_note:
            return Response(
                {"detail": "Aucune note SOAP à modifier pour ce rendez-vous."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SoapNoteSerializer(
            soap_note,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        log_audit_event(
            user=request.user,
            action="UPDATE",
            module="soap",
            object_type="SoapNote",
            object_id=soap_note.id,
            description=f"Modification de la note SOAP du rendez-vous #{appointment.id}.",
        )

        return Response(serializer.data, status=status.HTTP_200_OK)


class AppointmentSoapNoteAIDraftView(AppointmentAccessMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        appointment = self.get_scoped_queryset().filter(pk=pk).first()

        if not appointment:
            return Response(
                {"detail": "Rendez-vous introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if getattr(request.user, "role", None) != "PRACTITIONER":
            return Response(
                {"detail": "Seul le praticien peut utiliser l'IA."},
                status=status.HTTP_403_FORBIDDEN,
            )

        notes = (request.data.get("notes") or "").strip()

        if not notes:
            return Response(
                {"detail": "Veuillez fournir des notes."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            soap = generate_soap_from_notes(notes)

            log_audit_event(
                user=request.user,
                action="CREATE",
                module="soap_ai",
                object_type="SoapAIDraft",
                object_id=appointment.id,
                description=(
                    f"Génération IA d'une proposition SOAP pour le rendez-vous "
                    f"#{appointment.id}."
                ),
            )

            return Response(soap, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"detail": f"Erreur IA: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AppointmentSoapNoteTranscriptionView(AppointmentAccessMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        appointment = self.get_scoped_queryset().filter(pk=pk).first()

        if not appointment:
            return Response(
                {"detail": "Rendez-vous introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if getattr(request.user, "role", None) != "PRACTITIONER":
            return Response(
                {"detail": "Seul le praticien peut transcrire un mémo vocal."},
                status=status.HTTP_403_FORBIDDEN,
            )

        audio_file = request.FILES.get("audio")

        if not audio_file:
            return Response(
                {"detail": "Veuillez fournir un fichier audio."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            transcript = transcribe_audio_file(audio_file)

            if not transcript:
                return Response(
                    {"detail": "La transcription audio est vide."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            log_audit_event(
                user=request.user,
                action="CREATE",
                module="soap_audio",
                object_type="AudioTranscription",
                object_id=appointment.id,
                description=(
                    f"Transcription audio effectuée pour le rendez-vous "
                    f"#{appointment.id}."
                ),
            )

            return Response(
                {"transcript": transcript},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"detail": f"Erreur transcription: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )