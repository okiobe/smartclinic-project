from rest_framework import generics, permissions

from apps.audit.utils import log_audit_event
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

    def perform_create(self, serializer):
        service = serializer.save()

        log_audit_event(
            user=self.request.user,
            action="CREATE",
            module="services",
            object_type="Service",
            object_id=service.id,
            description=f"Création du service '{service.name}'.",
        )


class ServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ServiceSerializer
    queryset = Service.objects.all()

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [IsAdminUserRole()]
        return [permissions.AllowAny()]

    def perform_update(self, serializer):
        service = serializer.save()

        log_audit_event(
            user=self.request.user,
            action="UPDATE",
            module="services",
            object_type="Service",
            object_id=service.id,
            description=f"Modification du service '{service.name}'.",
        )

    def perform_destroy(self, instance):
        service_id = instance.id
        service_name = instance.name

        instance.delete()

        log_audit_event(
            user=self.request.user,
            action="DELETE",
            module="services",
            object_type="Service",
            object_id=service_id,
            description=f"Suppression du service '{service_name}'.",
        )