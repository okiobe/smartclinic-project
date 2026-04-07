from datetime import datetime, timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from .models import Appointment, Notification


def get_appointment_datetime(appointment):
    naive_dt = datetime.combine(
        appointment.appointment_date,
        appointment.start_time,
    )
    return timezone.make_aware(naive_dt, timezone.get_current_timezone())


def get_appointments_to_remind(reference_time=None, tolerance_minutes=30):
    """
    Retourne les rendez-vous à rappeler par email environ 24h avant.

    Exemple:
    - la tâche tourne à 10:00
    - on cible les rendez-vous entre 09:30 et 10:30 le lendemain
    """
    if reference_time is None:
        reference_time = timezone.now()

    target_time = reference_time + timedelta(hours=24)
    window_start = target_time - timedelta(minutes=tolerance_minutes)
    window_end = target_time + timedelta(minutes=tolerance_minutes)

    candidates = Appointment.objects.select_related(
        "patient__user",
        "practitioner__user",
        "service",
    ).filter(
        email_reminder_sent=False,
        status__in=[
            Appointment.Status.PENDING,
            Appointment.Status.CONFIRMED,
        ],
    )

    appointments_to_remind = []

    for appointment in candidates:
        appointment_dt = get_appointment_datetime(appointment)
        if window_start <= appointment_dt < window_end:
            appointments_to_remind.append(appointment)

    return appointments_to_remind


def build_email_message(appointment):
    patient_user = appointment.patient.user
    practitioner_user = appointment.practitioner.user

    patient_name = (
        f"{patient_user.first_name} {patient_user.last_name}".strip()
        or patient_user.email
    )
    practitioner_name = (
        f"{practitioner_user.first_name} {practitioner_user.last_name}".strip()
        or practitioner_user.email
    )

    return (
        f"Bonjour {patient_name},\n\n"
        f"Ceci est un rappel pour votre rendez-vous prévu demain, et dont les paramètres sont les suivants.\n\n"
        f"Service : {appointment.service.name}\n"
        f"Praticien : {practitioner_name}\n"
        f"Date : {appointment.appointment_date.strftime('%Y-%m-%d')}\n"
        f"Heure : {appointment.start_time.strftime('%H:%M')}\n\n"
        f"Veuillez vous présenter 15 minutes avant.\n"

        f"Merci,\n"
        f"L'équipe SmartClinic"
    )


def send_appointment_email_reminder(appointment):
    patient_user = appointment.patient.user
    message = build_email_message(appointment)

    send_mail(
        subject="Rappel de rendez-vous - SmartClinic",
        message=message,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        recipient_list=[patient_user.email],
        fail_silently=False,
    )

    return message


@transaction.atomic
def process_appointment_email_reminders(reference_time=None):
    if reference_time is None:
        reference_time = timezone.now()

    appointments = get_appointments_to_remind(reference_time=reference_time)

    sent_count = 0
    failed = []

    for appointment in appointments:
        try:
            message = send_appointment_email_reminder(appointment)

            Notification.objects.create(
                appointment=appointment,
                type=Notification.NotificationType.EMAIL,
                message=message,
                is_sent=True,
                sent_at=timezone.now(),
            )

            appointment.email_reminder_sent = True
            appointment.email_reminder_sent_at = timezone.now()
            appointment.save(
                update_fields=[
                    "email_reminder_sent",
                    "email_reminder_sent_at",
                ]
            )

            sent_count += 1

        except Exception as exc:
            Notification.objects.create(
                appointment=appointment,
                type=Notification.NotificationType.EMAIL,
                message=f"Échec envoi rappel email : {str(exc)}",
                is_sent=False,
                sent_at=None,
            )

            failed.append(
                {
                    "appointment_id": appointment.id,
                    "error": str(exc),
                }
            )

    return {
        "sent_count": sent_count,
        "failed": failed,
    }