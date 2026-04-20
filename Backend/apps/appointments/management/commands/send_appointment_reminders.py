from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.appointments.reminders import (
    process_appointment_email_reminders,
    process_missing_soap_daily_reminders,
)


class Command(BaseCommand):
    help = (
        "Envoie les rappels email des rendez-vous prévus environ 24 heures "
        "à l'avance et les rappels quotidiens pour les rendez-vous terminés "
        "sans note SOAP."
    )

    def handle(self, *args, **options):
        reference_time = timezone.now()

        email_result = process_appointment_email_reminders(
            reference_time=reference_time
        )

        soap_result = process_missing_soap_daily_reminders(
            reference_time=reference_time
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Rappels email envoyés : {email_result['sent_count']}"
            )
        )

        if email_result["failed"]:
            for item in email_result["failed"]:
                self.stdout.write(
                    self.style.WARNING(
                        f"Échec pour le rendez-vous #{item['appointment_id']} : "
                        f"{item['error']}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Rappels SOAP quotidiens envoyés : {soap_result['sent_count']}"
            )
        )