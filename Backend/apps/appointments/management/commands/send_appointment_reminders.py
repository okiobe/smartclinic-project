from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.appointments.reminders import process_appointment_email_reminders


class Command(BaseCommand):
    help = "Envoie les rappels via email des rendez-vous prévus environ 24 heures à l'avance."

    def handle(self, *args, **options):
        result = process_appointment_email_reminders(
            reference_time=timezone.now()
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Rappels email envoyés : {result['sent_count']}"
            )
        )

        if result["failed"]:
            for item in result["failed"]:
                self.stdout.write(
                    self.style.WARNING(
                        f"Échec pour le rendez-vous #{item['appointment_id']} : {item['error']}"
                    )
                )