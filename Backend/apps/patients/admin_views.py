from rest_framework import generics

from apps.core.permissions import IsAdminUserRole
from .models import Patient
from .serializers import AdminPatientSerializer


class AdminPatientListView(generics.ListAPIView):
    permission_classes = [IsAdminUserRole]
    serializer_class = AdminPatientSerializer

    def get_queryset(self):
        return Patient.objects.select_related("user").order_by("-created_at")


class AdminPatientDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAdminUserRole]
    serializer_class = AdminPatientSerializer

    def get_queryset(self):
        return Patient.objects.select_related("user")