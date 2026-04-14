from django.urls import path
from .views import MePatientView, AdminPatientListView, AdminPatientDetailView

urlpatterns = [
    path("me/", MePatientView.as_view(), name="patient-me"),
    path("admin/", AdminPatientListView.as_view(), name="admin-patient-list"),
    path("admin/<int:pk>/", AdminPatientDetailView.as_view(), name="admin-patient-detail"),
]