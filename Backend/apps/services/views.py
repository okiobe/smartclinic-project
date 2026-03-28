from rest_framework import generics, permissions

from apps.core.permissions import IsAdminUserRole
from .models import Service
from .serializers import ServiceSerializer


class ServiceListCreateView(generics.ListCreateAPIView):
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminUserRole()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Service.objects.all()

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            if is_active.lower() == "true":
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() == "false":
                queryset = queryset.filter(is_active=False)

        return queryset.order_by("name")


class ServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ServiceSerializer
    queryset = Service.objects.all()

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [IsAdminUserRole()]
        return [permissions.AllowAny()]