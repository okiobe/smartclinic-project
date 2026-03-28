from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/auth/", include("apps.accounts.urls")),

    path("api/services/", include("apps.services.urls")),
    path("api/admin/services/", include("apps.services.admin_urls")),

    path("api/practitioners/", include("apps.practitioners.urls")),
    path("api/appointments/", include("apps.appointments.urls")),
    
    path("api/admin/practitioners/", include("apps.practitioners.admin_urls")),

    path("api/patients/", include("apps.patients.urls")),

    path("api/admin/patients/", include("apps.patients.admin_urls")),
]