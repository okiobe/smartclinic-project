from rest_framework import generics, permissions

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


class AdminPractitionerDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUserRole]

    queryset = Practitioner.objects.select_related("user").prefetch_related(
        "services_offered__service"
    )

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return PractitionerUpdateSerializer
        return PractitionerSerializer

    def perform_destroy(self, instance):
        user = instance.user
        instance.delete()
        user.delete()