from django.db import models


class AvailabilityRule(models.Model):
    class WeekDay(models.IntegerChoices):
        MONDAY = 1, "Lundi"
        TUESDAY = 2, "Mardi"
        WEDNESDAY = 3, "Mercredi"
        THURSDAY = 4, "Jeudi"
        FRIDAY = 5, "Vendredi"
        SATURDAY = 6, "Samedi"
        SUNDAY = 7, "Dimanche"

    practitioner = models.ForeignKey(
        "practitioners.Practitioner",
        on_delete=models.CASCADE,
        related_name="availability_rules",
    )

    weekday = models.PositiveSmallIntegerField(choices=WeekDay.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["practitioner", "weekday", "start_time"]

    def __str__(self):
        return (
            f"{self.practitioner.user.email} - "
            f"{self.get_weekday_display()} "
            f"{self.start_time} à {self.end_time}"
        )