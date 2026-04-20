from datetime import datetime, timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from .models import Appointment, Notification


def get_display_name(user):
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.email


def get_appointment_datetime(appointment):
    naive_dt = datetime.combine(
        appointment.appointment_date,
        appointment.start_time,
    )
    return timezone.make_aware(naive_dt, timezone.get_current_timezone())


def create_system_notification(appointment, message):
    return Notification.objects.create(
        appointment=appointment,
        type=Notification.NotificationType.SYSTEM,
        message=message,
        is_sent=True,
        sent_at=timezone.now(),
    )


def send_email_notification(appointment, recipient_email, subject, message):
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[recipient_email],
            fail_silently=False,
        )

        Notification.objects.create(
            appointment=appointment,
            type=Notification.NotificationType.EMAIL,
            message=message,
            is_sent=True,
            sent_at=timezone.now(),
        )
        return True

    except Exception as exc:
        Notification.objects.create(
            appointment=appointment,
            type=Notification.NotificationType.EMAIL,
            message=f"Échec envoi email : {str(exc)}",
            is_sent=False,
            sent_at=None,
        )
        return False


def send_booking_notifications(appointment):
    patient_user = appointment.patient.user
    practitioner_user = appointment.practitioner.user

    patient_name = get_display_name(patient_user)
    practitioner_name = get_display_name(practitioner_user)

    patient_message = (
        f"Bonjour {patient_name},\n\n"
        f"Votre rendez-vous a bien été enregistré dans SmartClinic.\n\n"
        f"Service : {appointment.service.name}\n"
        f"Praticien : {practitioner_name}\n"
        f"Date : {appointment.appointment_date.strftime('%Y-%m-%d')}\n"
        f"Heure : {appointment.start_time.strftime('%H:%M')}\n\n"
        f"Merci,\n"
        f"L'équipe SmartClinic"
    )

    practitioner_message = (
        f"Bonjour {practitioner_name},\n\n"
        f"Un nouveau rendez-vous a été réservé par {patient_name}.\n\n"
        f"Service : {appointment.service.name}\n"
        f"Date : {appointment.appointment_date.strftime('%Y-%m-%d')}\n"
        f"Heure : {appointment.start_time.strftime('%H:%M')}\n\n"
        f"Merci,\n"
        f"L'équipe SmartClinic"
    )

    send_email_notification(
        appointment=appointment,
        recipient_email=patient_user.email,
        subject="Confirmation de réservation - SmartClinic",
        message=patient_message,
    )

    send_email_notification(
        appointment=appointment,
        recipient_email=practitioner_user.email,
        subject="Nouveau rendez-vous réservé - SmartClinic",
        message=practitioner_message,
    )


def notify_practitioner_patient_cancelled(appointment):
    patient_name = get_display_name(appointment.patient.user)
    message = (
        f"Le patient {patient_name} a annulé le rendez-vous du "
        f"{appointment.appointment_date.strftime('%Y-%m-%d')} à "
        f"{appointment.start_time.strftime('%H:%M')}."
    )
    create_system_notification(appointment, message)


def notify_patient_practitioner_cancelled(appointment):
    patient_user = appointment.patient.user
    practitioner_name = get_display_name(appointment.practitioner.user)
    patient_name = get_display_name(patient_user)

    message = (
        f"Bonjour {patient_name},\n\n"
        f"Votre rendez-vous avec {practitioner_name} prévu le "
        f"{appointment.appointment_date.strftime('%Y-%m-%d')} à "
        f"{appointment.start_time.strftime('%H:%M')} a été annulé par le praticien.\n\n"
        f"Merci,\n"
        f"L'équipe SmartClinic"
    )

    send_email_notification(
        appointment=appointment,
        recipient_email=patient_user.email,
        subject="Annulation de rendez-vous - SmartClinic",
        message=message,
    )


def notify_patient_appointment_confirmed(appointment):
    patient_user = appointment.patient.user
    practitioner_name = get_display_name(appointment.practitioner.user)
    patient_name = get_display_name(patient_user)

    email_message = (
        f"Bonjour {patient_name},\n\n"
        f"Votre rendez-vous a été confirmé par le praticien.\n\n"
        f"Service : {appointment.service.name}\n"
        f"Praticien : {practitioner_name}\n"
        f"Date : {appointment.appointment_date.strftime('%Y-%m-%d')}\n"
        f"Heure : {appointment.start_time.strftime('%H:%M')}\n\n"
        f"Merci,\n"
        f"L'équipe SmartClinic"
    )

    send_email_notification(
        appointment=appointment,
        recipient_email=patient_user.email,
        subject="Rendez-vous confirmé - SmartClinic",
        message=email_message,
    )

    system_message = (
        f"Votre rendez-vous du {appointment.appointment_date.strftime('%Y-%m-%d')} "
        f"à {appointment.start_time.strftime('%H:%M')} avec "
        f"{practitioner_name} a été confirmé."
    )
    create_system_notification(appointment, system_message)


def notify_patient_soap_note_created(appointment):
    practitioner_name = get_display_name(appointment.practitioner.user)
    message = (
        f"Une mise à jour de votre dossier médical a été effectuée par {practitioner_name} pour votre "
        f"rendez-vous du {appointment.appointment_date.strftime('%Y-%m-%d')}."
    )
    create_system_notification(appointment, message)


def get_appointments_to_remind(reference_time=None, tolerance_minutes=30):
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

    patient_name = get_display_name(patient_user)
    practitioner_name = get_display_name(practitioner_user)

    return (
        f"Bonjour {patient_name},\n\n"
        f"Ceci est un rappel pour votre rendez-vous prévu demain, et dont les paramètres sont les suivants.\n\n"
        f"Service : {appointment.service.name}\n"
        f"Praticien : {practitioner_name}\n"
        f"Date : {appointment.appointment_date.strftime('%Y-%m-%d')}\n"
        f"Heure : {appointment.start_time.strftime('%H:%M')}\n\n"
        f"Veuillez vous présenter 15 minutes avant.\n\n"
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


def get_appointments_missing_soap(reference_time=None):
    if reference_time is None:
        reference_time = timezone.now()

    one_day_ago = reference_time - timedelta(days=1)

    return Appointment.objects.select_related(
        "patient__user",
        "practitioner__user",
        "service",
    ).filter(
        status=Appointment.Status.COMPLETED,
        completed_at__isnull=False,
        completed_at__lte=one_day_ago,
        soap_note__isnull=True,
    )


@transaction.atomic
def process_missing_soap_daily_reminders(reference_time=None):
    if reference_time is None:
        reference_time = timezone.now()

    appointments = get_appointments_missing_soap(reference_time=reference_time)

    sent_count = 0

    for appointment in appointments:
        last_sent = appointment.soap_note_reminder_last_sent_at

        if last_sent and (reference_time - last_sent) < timedelta(days=1):
            continue

        patient_name = get_display_name(appointment.patient.user)

        message = (
            f"Rappel quotidien : aucune note SOAP n'a encore été saisie pour le "
            f"rendez-vous terminé de {patient_name} du "
            f"{appointment.appointment_date.strftime('%Y-%m-%d')} à "
            f"{appointment.start_time.strftime('%H:%M')}."
        )

        create_system_notification(appointment, message)

        appointment.soap_note_reminder_last_sent_at = reference_time
        appointment.save(update_fields=["soap_note_reminder_last_sent_at"])

        sent_count += 1

    return {"sent_count": sent_count}