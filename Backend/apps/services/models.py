from django.db import models


class Service(models.Model):

    name = models.CharField(max_length=120)

    description = models.TextField(blank=True)

    duration_minutes = models.PositiveIntegerField(
        help_text="Durée du service en minutes"
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name