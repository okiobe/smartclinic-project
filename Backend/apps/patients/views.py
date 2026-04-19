from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.utils import log_audit_event
from apps.core.permissions import IsAdminUserRole
from .models import Patient
from .serializers import PatientSerializer, AdminPatientSerializer


class MePatientView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_patient(self, request):
        return Patient.objects.select_related("user").filter(user=request.user).first()

    def get(self, request):
        patient = self.get_patient(request)

        if not patient:
            return Response(
                {"detail": "Profil patient introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(PatientSerializer(patient).data)

    def patch(self, request):
        patient = self.get_patient(request)

        if not patient:
            return Response(
                {"detail": "Profil patient introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PatientSerializer(
            patient,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        log_audit_event(
            user=request.user,
            action="UPDATE",
            module="patients",
            object_type="Patient",
            object_id=patient.id,
            description=(
                f"Mise à jour du profil patient "
                f"'{patient.user.first_name} {patient.user.last_name}'."
            ),
        )

        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminPatientListView(generics.ListAPIView):
    serializer_class = AdminPatientSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        return Patient.objects.select_related("user").order_by(
            "user__first_name",
            "user__last_name",
        )


class AdminPatientDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = AdminPatientSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        return Patient.objects.select_related("user").order_by(
            "user__first_name",
            "user__last_name",
        )

    def perform_destroy(self, instance):
        patient_id = instance.id
        patient_name = f"{instance.user.first_name} {instance.user.last_name}".strip()

        user = instance.user
        instance.delete()
        user.delete()

        log_audit_event(
            user=self.request.user,
            action="DELETE",
            module="patients",
            object_type="Patient",
            object_id=patient_id,
            description=f"Suppression du patient '{patient_name}'.",
        )