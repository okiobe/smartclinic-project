from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

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
        user = instance.user
        instance.delete()
        user.delete()