from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Patient
from .serializers import PatientSerializer


class MePatientView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        patient = Patient.objects.select_related("user").filter(user=request.user).first()

        if not patient:
            return Response(
                {"detail": "Profil patient introuvable."},
                status=404,
            )

        return Response(PatientSerializer(patient).data)