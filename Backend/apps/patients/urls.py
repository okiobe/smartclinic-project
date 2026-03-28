from django.urls import path
from .views import MePatientView

urlpatterns = [
    path("me/", MePatientView.as_view(), name="patient-me"),
]