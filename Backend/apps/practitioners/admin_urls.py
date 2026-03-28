from django.urls import path
from .views import (
    AdminPractitionerListCreateView,
    AdminPractitionerDetailView,
)

urlpatterns = [
    path("", AdminPractitionerListCreateView.as_view(), name="admin-practitioner-list"),
    path("<int:pk>/", AdminPractitionerDetailView.as_view(), name="admin-practitioner-detail"),
]