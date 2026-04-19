from rest_framework import generics, permissions

from apps.audit.utils import log_audit_event
from apps.availability.models import AvailabilityRule
from apps.availability.serializers import AvailabilityRuleSerializer
from apps.core.permissions import IsAdminUserRole
from .models import Practitioner
from .serializers import (
    PractitionerCreateSerializer,
    PractitionerSerializer,
    PractitionerUpdateSerializer,
)


class PractitionerListView(generics.ListAPIView):
    serializer_class = PractitionerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Practitioner.objects.select_related("user").prefetch_related(
            "services_offered__service"
        )

        service_id = self.request.query_params.get("service")
        if service_id:
            queryset = queryset.filter(services_offered__service_id=service_id)

        return queryset.order_by("user__first_name", "user__last_name").distinct()


class PractitionerDetailView(generics.RetrieveAPIView):
    serializer_class = PractitionerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Practitioner.objects.select_related("user").prefetch_related(
            "services_offered__service"
        )


class PractitionerAvailabilityView(generics.ListAPIView):
    serializer_class = AvailabilityRuleSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        practitioner_id = self.kwargs["pk"]
        return AvailabilityRule.objects.filter(
            practitioner_id=practitioner_id,
            is_active=True,
        ).order_by("weekday", "start_time")


class AdminPractitionerListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUserRole]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PractitionerCreateSerializer
        return PractitionerSerializer

    def get_queryset(self):
        return Practitioner.objects.select_related("user").prefetch_related(
            "services_offered__service"
        ).order_by("user__first_name", "user__last_name")

    def perform_create(self, serializer):
        practitioner = serializer.save()

        log_audit_event(
            user=self.request.user,
            action="CREATE",
            module="practitioners",
            object_type="Practitioner",
            object_id=practitioner.id,
            description=(
                f"Création du praticien "
                f"'{practitioner.user.first_name} {practitioner.user.last_name}'."
            ),
        )


class AdminPractitionerDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUserRole]

    queryset = Practitioner.objects.select_related("user").prefetch_related(
        "services_offered__service"
    )

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return PractitionerUpdateSerializer
        return PractitionerSerializer

    def perform_update(self, serializer):
        practitioner = serializer.save()

        log_audit_event(
            user=self.request.user,
            action="UPDATE",
            module="practitioners",
            object_type="Practitioner",
            object_id=practitioner.id,
            description=(
                f"Modification du praticien "
                f"'{practitioner.user.first_name} {practitioner.user.last_name}'."
            ),
        )

    def perform_destroy(self, instance):
        practitioner_id = instance.id
        full_name = f"{instance.user.first_name} {instance.user.last_name}".strip()

        user = instance.user
        instance.delete()
        user.delete()

        log_audit_event(
            user=self.request.user,
            action="DELETE",
            module="practitioners",
            object_type="Practitioner",
            object_id=practitioner_id,
            description=f"Suppression du praticien '{full_name}'.",
        )