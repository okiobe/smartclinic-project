from django.urls import path
from .views import (
    AppointmentListCreateView,
    AppointmentDetailView,
    AppointmentStatusUpdateView,
    AppointmentCancelView,
    AppointmentSoapNoteView,
    AppointmentSoapNoteAIDraftView,
    AppointmentSoapNoteTranscriptionView,
)

urlpatterns = [
    path("", AppointmentListCreateView.as_view(), name="appointment-list-create"),
    path("<int:pk>/", AppointmentDetailView.as_view(), name="appointment-detail"),
    path(
        "<int:pk>/status/",
        AppointmentStatusUpdateView.as_view(),
        name="appointment-status-update",
    ),
    path(
        "<int:pk>/cancel/",
        AppointmentCancelView.as_view(),
        name="appointment-cancel",
    ),
    path(
        "<int:pk>/soap-note/",
        AppointmentSoapNoteView.as_view(),
        name="appointment-soap-note",
    ),
    path(
        "<int:pk>/soap-note/ai-draft/",
        AppointmentSoapNoteAIDraftView.as_view(),
        name="appointment-soap-note-ai-draft",
    ),
    path(
        "<int:pk>/soap-note/transcribe/",
        AppointmentSoapNoteTranscriptionView.as_view(),
        name="appointment-soap-note-transcribe",
    ),
]