from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Patient
from .serializers import PatientSerializer


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

        serializer = PatientSerializer(patient, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)