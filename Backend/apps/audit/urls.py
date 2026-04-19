from django.urls import path
from .views import AuditLogListView, AuditLogExportCSVView

urlpatterns = [
    path("", AuditLogListView.as_view(), name="audit-log-list"),
    path("export/csv/", AuditLogExportCSVView.as_view(), name="audit-log-export-csv"),
]