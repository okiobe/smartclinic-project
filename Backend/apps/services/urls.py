from django.urls import path
from .views import ServiceListCreateView, ServiceDetailView

urlpatterns = [
    path("", ServiceListCreateView.as_view(), name="admin-service-list-create"),
    path("<int:pk>/", ServiceDetailView.as_view(), name="admin-service-detail"),
]