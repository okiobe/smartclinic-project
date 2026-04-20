from django.urls import path
from .views import (
    AdminPractitionerAvailabilityListCreateView,
    AdminAvailabilityDetailView,
    PractitionerMyAvailabilityListView,
    PractitionerMyAvailabilityListCreateView,
    PractitionerMyAvailabilityDetailView,
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
    path(
        "practitioner/me/availabilities/manage/",
        PractitionerMyAvailabilityListCreateView.as_view(),
        name="practitioner-my-availabilities-manage",
    ),
    path(
        "practitioner/me/availabilities/<int:pk>/",
        PractitionerMyAvailabilityDetailView.as_view(),
        name="practitioner-my-availability-detail",
    ),
]