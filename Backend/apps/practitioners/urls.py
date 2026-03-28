from django.urls import path
from .views import (
    AdminPractitionerDetailView,
    AdminPractitionerListCreateView,
    PractitionerAvailabilityView,
    PractitionerDetailView,
    PractitionerListView,
)

urlpatterns = [
    path("", PractitionerListView.as_view(), name="practitioner-list"),
    path("<int:pk>/", PractitionerDetailView.as_view(), name="practitioner-detail"),
    path(
        "<int:pk>/availability/",
        PractitionerAvailabilityView.as_view(),
        name="practitioner-availability",
    ),
    path(
        "admin/",
        AdminPractitionerListCreateView.as_view(),
        name="admin-practitioner-list-create",
    ),
    path(
        "admin/<int:pk>/",
        AdminPractitionerDetailView.as_view(),
        name="admin-practitioner-detail",
    ),
]