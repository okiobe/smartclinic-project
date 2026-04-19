from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from apps.audit.utils import log_audit_event
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
        return Practitioner.objects.select_related("user").get(pk=practitioner_id)

    def get_queryset(self):
        practitioner = self.get_practitioner()
        return AvailabilityRule.objects.filter(
            practitioner=practitioner
        ).order_by("weekday", "start_time")

    def perform_create(self, serializer):
        practitioner = self.get_practitioner()
        availability = serializer.save(practitioner=practitioner)

        log_audit_event(
            user=self.request.user,
            action="CREATE",
            module="availability",
            object_type="AvailabilityRule",
            object_id=availability.id,
            description=(
                f"Création d'une disponibilité pour "
                f"'{practitioner.user.first_name} {practitioner.user.last_name}' : "
                f"jour {availability.weekday}, "
                f"{availability.start_time} - {availability.end_time}, "
                f"actif={availability.is_active}."
            ),
        )


class AdminAvailabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AvailabilityRuleSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        return AvailabilityRule.objects.select_related("practitioner", "practitioner__user")

    def perform_update(self, serializer):
        old_instance = self.get_object()

        old_weekday = old_instance.weekday
        old_start_time = old_instance.start_time
        old_end_time = old_instance.end_time
        old_is_active = old_instance.is_active

        availability = serializer.save()

        description = (
            f"Modification de la disponibilité #{availability.id} de "
            f"'{availability.practitioner.user.first_name} {availability.practitioner.user.last_name}' : "
            f"jour {old_weekday} -> {availability.weekday}, "
            f"{old_start_time} - {old_end_time} -> "
            f"{availability.start_time} - {availability.end_time}, "
            f"actif {old_is_active} -> {availability.is_active}."
        )

        log_audit_event(
            user=self.request.user,
            action="UPDATE",
            module="availability",
            object_type="AvailabilityRule",
            object_id=availability.id,
            description=description,
        )

    def perform_destroy(self, instance):
        availability_id = instance.id
        practitioner_name = (
            f"{instance.practitioner.user.first_name} "
            f"{instance.practitioner.user.last_name}"
        ).strip()

        description = (
            f"Suppression de la disponibilité #{availability_id} de "
            f"'{practitioner_name}' : jour {instance.weekday}, "
            f"{instance.start_time} - {instance.end_time}."
        )

        instance.delete()

        log_audit_event(
            user=self.request.user,
            action="DELETE",
            module="availability",
            object_type="AvailabilityRule",
            object_id=availability_id,
            description=description,
        )


class PractitionerMyAvailabilityListView(generics.ListAPIView):
    serializer_class = AvailabilityRuleSerializer
    permission_classes = [IsPractitionerUserRole]

    def get_queryset(self):
        if not hasattr(self.request.user, "practitioner_profile"):
            raise PermissionDenied("Profil praticien introuvable.")

        return AvailabilityRule.objects.filter(
            practitioner=self.request.user.practitioner_profile
        ).order_by("weekday", "start_time")