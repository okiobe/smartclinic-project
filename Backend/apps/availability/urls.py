from django.urls import path
from .views import (
    AdminPractitionerAvailabilityListCreateView,
    AdminAvailabilityDetailView,
    PractitionerMyAvailabilityListView,
)

urlpatterns = [
    path(
        "admin/practitioners/<int:practitioner_id>/availabilities/",
        AdminPractitionerAvailabilityListCreateView.as_view(),
        name="admin-practitioner-availabilities",
    ),
    path(
        "admin/availabilities/<int:pk>/",
        AdminAvailabilityDetailView.as_view(),
        name="admin-availability-detail",
    ),
    path(
        "practitioner/me/availabilities/",
        PractitionerMyAvailabilityListView.as_view(),
        name="practitioner-my-availabilities",
    ),
]