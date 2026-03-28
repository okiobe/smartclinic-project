from django.db import models
from django.conf import settings


class Practitioner(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="practitioner_profile"
    )

    specialty = models.CharField(max_length=120)
    bio = models.TextField(blank=True)
    clinic_name = models.CharField(max_length=150, blank=True)

    phone = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Practitioner: {self.user.email}"


class PractitionerService(models.Model):

    practitioner = models.ForeignKey(
        Practitioner,
        on_delete=models.CASCADE,
        related_name="services_offered"
    )

    service = models.ForeignKey(
        "services.Service",
        on_delete=models.CASCADE,
        related_name="practitioners"
    )

    class Meta:
        unique_together = ("practitioner", "service")

    def __str__(self):
        return f"{self.practitioner.user.email} - {self.service.name}"