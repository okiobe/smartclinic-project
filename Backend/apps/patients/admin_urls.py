from django.urls import path
from .admin_views import AdminPatientListView, AdminPatientDetailView

urlpatterns = [
    path("", AdminPatientListView.as_view(), name="admin-patient-list"),
    path("<int:pk>/", AdminPatientDetailView.as_view(), name="admin-patient-detail"),
]