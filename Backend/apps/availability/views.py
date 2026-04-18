from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from .models import AvailabilityRule
from .serializers import AvailabilityRuleSerializer
from apps.practitioners.models import Practitioner


class IsAdminUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "ADMIN"
        )


class IsPractitionerUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "PRACTITIONER"
        )


class AdminPractitionerAvailabilityListCreateView(generics.ListCreateAPIView):
    serializer_class = AvailabilityRuleSerializer
    permission_classes = [IsAdminUserRole]

    def get_practitioner(self):
        practitioner_id = self.kwargs["practitioner_id"]
        return Practitioner.objects.get(pk=practitioner_id)

    def get_queryset(self):
        practitioner = self.get_practitioner()
        return AvailabilityRule.objects.filter(
            practitioner=practitioner
        ).order_by("weekday", "start_time")

    def perform_create(self, serializer):
        practitioner = self.get_practitioner()
        serializer.save(practitioner=practitioner)


class AdminAvailabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AvailabilityRuleSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        return AvailabilityRule.objects.select_related("practitioner", "practitioner__user")


class PractitionerMyAvailabilityListView(generics.ListAPIView):
    serializer_class = AvailabilityRuleSerializer
    permission_classes = [IsPractitionerUserRole]

    def get_queryset(self):
        if not hasattr(self.request.user, "practitioner_profile"):
            raise PermissionDenied("Profil praticien introuvable.")

        return AvailabilityRule.objects.filter(
            practitioner=self.request.user.practitioner_profile
        ).order_by("weekday", "start_time")