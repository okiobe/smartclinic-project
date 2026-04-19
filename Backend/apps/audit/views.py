import csv
from django.db.models import Q
from django.http import HttpResponse
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView

from apps.core.permissions import IsAdminUserRole
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class AuditLogQueryMixin:
    def get_filtered_queryset(self):
        queryset = AuditLog.objects.select_related("user").all()

        module = self.request.query_params.get("module")
        action = self.request.query_params.get("action")
        role = self.request.query_params.get("role")
        user_id = self.request.query_params.get("user_id")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        q = (self.request.query_params.get("q") or "").strip()

        if module:
            queryset = queryset.filter(module=module)

        if action:
            queryset = queryset.filter(action=action)

        if role:
            queryset = queryset.filter(role=role)

        if user_id:
            queryset = queryset.filter(user_id=user_id)

        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)

        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        if q:
            queryset = queryset.filter(
                Q(description__icontains=q)
                | Q(module__icontains=q)
                | Q(action__icontains=q)
                | Q(object_type__icontains=q)
                | Q(user__email__icontains=q)
                | Q(user__first_name__icontains=q)
                | Q(user__last_name__icontains=q)
                | Q(role__icontains=q)
            )

        return queryset


class AuditLogListView(AuditLogQueryMixin, generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUserRole]
    pagination_class = AuditLogPagination

    def get_queryset(self):
        return self.get_filtered_queryset()


class AuditLogExportCSVView(AuditLogQueryMixin, APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        queryset = self.get_filtered_queryset()

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="audit_logs.csv"'

        writer = csv.writer(response)
        writer.writerow(
            [
                "ID",
                "Date",
                "Utilisateur",
                "Email",
                "Rôle",
                "Action",
                "Module",
                "Type objet",
                "ID objet",
                "Description",
            ]
        )

        for log in queryset:
            writer.writerow(
                [
                    log.id,
                    log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    getattr(log.user, "get_full_name", lambda: "")().strip()
                    or getattr(log.user, "email", "")
                    or "Système",
                    getattr(log.user, "email", "") if log.user else "",
                    log.role,
                    log.action,
                    log.module,
                    log.object_type,
                    log.object_id or "",
                    log.description,
                ]
            )

        return response