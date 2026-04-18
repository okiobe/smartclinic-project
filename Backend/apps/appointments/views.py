from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .ai_service import generate_soap_from_notes
from .audio_service import transcribe_audio_file

from .models import Appointment, SoapNote
from .serializers import (
    AppointmentSerializer,
    AppointmentCreateSerializer,
    SoapNoteSerializer,
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

        new_status = request.data.get("status")
        allowed_statuses = {"PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"}

        if new_status not in allowed_statuses:
            return Response(
                {"detail": "Statut invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointment.status = new_status
        appointment.save(update_fields=["status"])

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

        appointment.status = "CANCELLED"
        appointment.save(update_fields=["status"])

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
        serializer.save(appointment=appointment)

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

            return Response(
                {"transcript": transcript},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"detail": f"Erreur transcription: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )