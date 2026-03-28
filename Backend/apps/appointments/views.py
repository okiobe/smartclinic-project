from rest_framework import generics, permissions
from .models import Appointment
from .serializers import AppointmentSerializer, AppointmentCreateSerializer


class AppointmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = Appointment.objects.select_related(
            "patient__user",
            "practitioner__user",
            "service",
        )

        # Filtrage par rôle
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

        # Filtres optionnels
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