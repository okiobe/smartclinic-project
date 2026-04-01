from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Appointment
from .serializers import (
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AppointmentStatusUpdateSerializer,
)


class AppointmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = Appointment.objects.select_related(
            "patient__user",
            "practitioner__user",
            "service",
        )

        if getattr(user, "role", None) == "PATIENT":
            if hasattr(user, "patient_profile"):
                queryset = queryset.filter(patient=user.patient_profile)
            else:
                return Appointment.objects.none()

        elif getattr(user, "role", None) == "PRACTITIONER":
            if hasattr(user, "practitioner_profile"):
                queryset = queryset.filter(practitioner=user.practitioner_profile)
            else:
                return Appointment.objects.none()

        elif getattr(user, "role", None) == "ADMIN":
            pass

        else:
            return Appointment.objects.none()

        patient_id = self.request.query_params.get("patient")
        practitioner_id = self.request.query_params.get("practitioner")
        appointment_date = self.request.query_params.get("date")
        appointment_status = self.request.query_params.get("status")

        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        if practitioner_id:
            queryset = queryset.filter(practitioner_id=practitioner_id)

        if appointment_date:
            queryset = queryset.filter(appointment_date=appointment_date)

        if appointment_status:
            queryset = queryset.filter(status=appointment_status)

        return queryset.order_by("appointment_date", "start_time")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        user = self.request.user
        role = getattr(user, "role", None)

        if role == "PATIENT":
            if not hasattr(user, "patient_profile"):
                raise ValidationError(
                    {"detail": "Aucun profil patient associé à cet utilisateur."}
                )
            serializer.save(patient=user.patient_profile)
            return

        if role == "ADMIN":
            serializer.save()
            return

        raise PermissionDenied(
            "Seuls un patient ou un administrateur peuvent créer un rendez-vous."
        )


class AppointmentDetailView(generics.RetrieveAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = Appointment.objects.select_related(
            "patient__user",
            "practitioner__user",
            "service",
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


class AppointmentStatusUpdateView(generics.UpdateAPIView):
    serializer_class = AppointmentStatusUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["patch"]

    def get_queryset(self):
        user = self.request.user

        queryset = Appointment.objects.select_related(
            "patient__user",
            "practitioner__user",
            "service",
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

    def patch(self, request, *args, **kwargs):
        appointment = self.get_object()
        user = request.user
        role = getattr(user, "role", None)
        new_status = request.data.get("status")

        if not new_status:
            raise ValidationError({"status": "Le champ status est requis."})

        allowed_statuses = {
            "PATIENT": {"CANCELLED"},
            "PRACTITIONER": {"CONFIRMED", "CANCELLED", "COMPLETED"},
            "ADMIN": {"PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"},
        }

        if role not in allowed_statuses:
            raise PermissionDenied("Vous n'avez pas la permission de modifier ce statut.")

        if new_status not in allowed_statuses[role]:
            raise PermissionDenied(
                f"Le rôle {role} ne peut pas définir le statut '{new_status}'."
            )

        serializer = self.get_serializer(
            appointment,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        appointment.refresh_from_db()

        return Response(
            AppointmentSerializer(appointment).data,
            status=status.HTTP_200_OK,
        )