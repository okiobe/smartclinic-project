from datetime import time, timedelta

from django.contrib.auth import get_user_model
from django.core import mail
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.availability.models import AvailabilityRule
from apps.appointments.models import Appointment, Notification, SoapNote
from apps.appointments.reminders import (
    process_appointment_email_reminders,
    process_missing_soap_daily_reminders,
)
from apps.patients.models import Patient
from apps.practitioners.models import Practitioner
from apps.services.models import Service

User = get_user_model()


class AppointmentAPITests(APITestCase):
    def setUp(self):
        self.patient_password = "PatientPass123!"
        self.practitioner_password = "PractitionerPass123!"
        self.admin_password = "AdminPass123!"

        self.patient_user = User.objects.create_user(
            email="patient@test.com",
            password=self.patient_password,
            first_name="Patient",
            last_name="Test",
            role="PATIENT",
        )
        self.patient = Patient.objects.create(user=self.patient_user)

        self.practitioner_user = User.objects.create_user(
            email="practitioner@test.com",
            password=self.practitioner_password,
            first_name="Docteur",
            last_name="Tremblay",
            role="PRACTITIONER",
        )
        self.practitioner = Practitioner.objects.create(
            user=self.practitioner_user,
            specialty="Physiothérapie",
            bio="Bio test",
            clinic_name="SmartClinic",
            phone="1234567890",
        )

        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            password=self.admin_password,
            first_name="Admin",
            last_name="Test",
            role="ADMIN",
        )

        self.service = Service.objects.create(
            name="Massage thérapeutique",
            description="Service test",
            duration_minutes=60,
            price=100,
            is_active=True,
        )

        self.tomorrow = timezone.localdate() + timedelta(days=1)
        self.tomorrow_weekday = self.tomorrow.isoweekday()

        AvailabilityRule.objects.create(
            practitioner=self.practitioner,
            weekday=self.tomorrow_weekday,
            start_time=time(9, 0),
            end_time=time(17, 0),
            is_active=True,
        )

        self.list_create_url = "/api/appointments/"
        self.create_payload = {
            "patient": self.patient.id,
            "practitioner": self.practitioner.id,
            "service": self.service.id,
            "appointment_date": self.tomorrow.isoformat(),
            "start_time": "10:00:00",
            "end_time": "11:00:00",
            "reason": "Douleur lombaire",
        }

    def authenticate_as(self, user):
        self.client.force_authenticate(user=user)

    def create_appointment_direct(
        self,
        status_value="PENDING",
        appointment_date=None,
        start_time_value=time(10, 0),
        end_time_value=time(11, 0),
    ):
        return Appointment.objects.create(
            patient=self.patient,
            practitioner=self.practitioner,
            service=self.service,
            appointment_date=appointment_date or self.tomorrow,
            start_time=start_time_value,
            end_time=end_time_value,
            status=status_value,
            reason="Douleur lombaire",
        )

    def test_patient_can_create_valid_appointment(self):
        self.authenticate_as(self.patient_user)

        response = self.client.post(
            self.list_create_url,
            self.create_payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Appointment.objects.count(), 1)

        appointment = Appointment.objects.first()
        self.assertEqual(appointment.patient, self.patient)
        self.assertEqual(appointment.practitioner, self.practitioner)
        self.assertEqual(appointment.service, self.service)

    def test_cannot_book_in_past_day(self):
        self.authenticate_as(self.patient_user)

        payload = self.create_payload.copy()
        payload["appointment_date"] = (
            timezone.localdate() - timedelta(days=1)
        ).isoformat()

        response = self.client.post(
            self.list_create_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Appointment.objects.count(), 0)

    def test_cannot_double_book_same_slot(self):
        self.create_appointment_direct()
        self.authenticate_as(self.patient_user)

        response = self.client.post(
            self.list_create_url,
            self.create_payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Appointment.objects.count(), 1)

    def test_practitioner_can_confirm_appointment(self):
        appointment = self.create_appointment_direct(status_value="PENDING")
        self.authenticate_as(self.practitioner_user)

        url = f"/api/appointments/{appointment.id}/status/"
        response = self.client.patch(
            url,
            {"status": "CONFIRMED"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        appointment.refresh_from_db()
        self.assertEqual(appointment.status, "CONFIRMED")

    def test_practitioner_can_complete_appointment(self):
        appointment = self.create_appointment_direct(status_value="CONFIRMED")
        self.authenticate_as(self.practitioner_user)

        url = f"/api/appointments/{appointment.id}/status/"
        response = self.client.patch(
            url,
            {"status": "COMPLETED"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        appointment.refresh_from_db()
        self.assertEqual(appointment.status, "COMPLETED")
        self.assertIsNotNone(appointment.completed_at)

    def test_patient_can_cancel_appointment(self):
        appointment = self.create_appointment_direct(status_value="PENDING")
        self.authenticate_as(self.patient_user)

        url = f"/api/appointments/{appointment.id}/cancel/"
        response = self.client.patch(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        appointment.refresh_from_db()
        self.assertEqual(appointment.status, "CANCELLED")

    def test_practitioner_can_cancel_appointment(self):
        appointment = self.create_appointment_direct(status_value="CONFIRMED")
        self.authenticate_as(self.practitioner_user)

        url = f"/api/appointments/{appointment.id}/cancel/"
        response = self.client.patch(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        appointment.refresh_from_db()
        self.assertEqual(appointment.status, "CANCELLED")

    def test_practitioner_can_create_soap_note(self):
        appointment = self.create_appointment_direct(status_value="COMPLETED")
        self.authenticate_as(self.practitioner_user)

        url = f"/api/appointments/{appointment.id}/soap-note/"
        payload = {
            "subjective": "Douleur 7/10",
            "objective": "Amplitude limitée",
            "assessment": "Lombalgie mécanique",
            "plan": "Repos et suivi",
        }

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            SoapNote.objects.filter(appointment=appointment).exists()
        )

    def test_practitioner_can_update_soap_note(self):
        appointment = self.create_appointment_direct(status_value="COMPLETED")
        soap = SoapNote.objects.create(
            appointment=appointment,
            subjective="Initial",
            objective="Initial",
            assessment="Initial",
            plan="Initial",
        )
        self.authenticate_as(self.practitioner_user)

        url = f"/api/appointments/{appointment.id}/soap-note/"
        payload = {
            "subjective": "Mis à jour",
            "plan": "Plan mis à jour",
        }

        response = self.client.patch(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        soap.refresh_from_db()
        self.assertEqual(soap.subjective, "Mis à jour")
        self.assertEqual(soap.plan, "Plan mis à jour")

    def test_patient_cannot_create_soap_note(self):
        appointment = self.create_appointment_direct(status_value="COMPLETED")
        self.authenticate_as(self.patient_user)

        url = f"/api/appointments/{appointment.id}/soap-note/"
        payload = {
            "subjective": "Douleur 7/10",
            "objective": "Amplitude limitée",
            "assessment": "Lombalgie mécanique",
            "plan": "Repos et suivi",
        }

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_daily_missing_soap_reminder_is_created(self):
        appointment = self.create_appointment_direct(status_value="COMPLETED")
        appointment.completed_at = timezone.now() - timedelta(days=1, minutes=5)
        appointment.soap_note_reminder_last_sent_at = None
        appointment.save(
            update_fields=["completed_at", "soap_note_reminder_last_sent_at"]
        )

        result = process_missing_soap_daily_reminders(
            reference_time=timezone.now()
        )

        self.assertEqual(result["sent_count"], 1)

        appointment.refresh_from_db()
        self.assertIsNotNone(appointment.soap_note_reminder_last_sent_at)
        self.assertTrue(
            Notification.objects.filter(appointment=appointment).exists()
        )

    def test_daily_missing_soap_reminder_not_sent_twice_same_day(self):
        appointment = self.create_appointment_direct(status_value="COMPLETED")
        appointment.completed_at = timezone.now() - timedelta(days=2)
        appointment.soap_note_reminder_last_sent_at = timezone.now() - timedelta(hours=2)
        appointment.save(
            update_fields=["completed_at", "soap_note_reminder_last_sent_at"]
        )

        result = process_missing_soap_daily_reminders(
            reference_time=timezone.now()
        )

        self.assertEqual(result["sent_count"], 0)

    def test_booking_notifications_send_emails(self):
        self.authenticate_as(self.patient_user)

        response = self.client.post(
            self.list_create_url,
            self.create_payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 2)

    def test_appointment_email_reminder_24h(self):
        appointment = self.create_appointment_direct(
            status_value="CONFIRMED",
            appointment_date=self.tomorrow,
        )
        appointment.email_reminder_sent = False
        appointment.email_reminder_sent_at = None
        appointment.save(
            update_fields=["email_reminder_sent", "email_reminder_sent_at"]
        )

        # référence proche de 24h avant 10:00 demain
        reference_time = timezone.now().replace(
            hour=10,
            minute=0,
            second=0,
            microsecond=0,
        )

        # si jamais la date courante ne correspond pas à "la veille",
        # on force une référence cohérente
        target_datetime = timezone.make_aware(
            timezone.datetime.combine(
                appointment.appointment_date,
                appointment.start_time,
            )
        )
        reference_time = target_datetime - timedelta(hours=24)

        result = process_appointment_email_reminders(
            reference_time=reference_time
        )

        self.assertEqual(result["sent_count"], 1)

        appointment.refresh_from_db()
        self.assertTrue(appointment.email_reminder_sent)
        self.assertIsNotNone(appointment.email_reminder_sent_at)