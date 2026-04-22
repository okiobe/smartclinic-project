from django.contrib.auth import get_user_model
from django.core import mail
from rest_framework import status
from rest_framework.test import APITestCase

from apps.patients.models import Patient

User = get_user_model()


class AccountsAPITests(APITestCase):
    def setUp(self):
        self.register_url = "/api/auth/register/"
        self.login_url = "/api/auth/login/"
        self.change_password_url = "/api/auth/change-password-from-login/"

        self.patient_password = "TestPass123!"
        self.patient_user = User.objects.create_user(
            email="patient@test.com",
            password=self.patient_password,
            first_name="John",
            last_name="Wick",
            role="PATIENT",
        )
        self.patient_profile = Patient.objects.create(user=self.patient_user)

    def test_register_patient_success(self):
        payload = {
            "email": "newpatient@test.com",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
            "first_name": "Nouveau",
            "last_name": "Patient",
        }

        response = self.client.post(self.register_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created_user = User.objects.filter(email="newpatient@test.com").first()
        self.assertIsNotNone(created_user)
        self.assertEqual(created_user.role, "PATIENT")
        self.assertTrue(hasattr(created_user, "patient_profile"))

    def test_register_sends_welcome_email(self):
        payload = {
            "email": "welcome@test.com",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
            "first_name": "Welcome",
            "last_name": "User",
        }

        response = self.client.post(self.register_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Bienvenue", mail.outbox[0].subject)
        self.assertIn("welcome@test.com", mail.outbox[0].to)

    def test_login_patient_success(self):
        payload = {
            "email": "patient@test.com",
            "password": self.patient_password,
        }

        response = self.client.post(self.login_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["email"], "patient@test.com")

    def test_login_patient_wrong_password_fails(self):
        payload = {
            "email": "patient@test.com",
            "password": "WrongPassword123!",
        }

        response = self.client.post(self.login_url, payload, format="json")

        self.assertIn(
            response.status_code,
            [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED],
        )

    def test_change_password_from_login_success(self):
        payload = {
            "email": "patient@test.com",
            "old_password": self.patient_password,
            "new_password": "NewStrongPass123!",
            "new_password_confirm": "NewStrongPass123!",
        }

        response = self.client.post(
            self.change_password_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.patient_user.refresh_from_db()
        self.assertTrue(self.patient_user.check_password("NewStrongPass123!"))
        self.assertFalse(self.patient_user.check_password(self.patient_password))

    def test_change_password_from_login_rejects_wrong_old_password(self):
        payload = {
            "email": "patient@test.com",
            "old_password": "WrongPassword123!",
            "new_password": "NewStrongPass123!",
            "new_password_confirm": "NewStrongPass123!",
        }

        response = self.client.post(
            self.change_password_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.patient_user.refresh_from_db()
        self.assertTrue(self.patient_user.check_password(self.patient_password))

    def test_change_password_from_login_rejects_mismatch_confirmation(self):
        payload = {
            "email": "patient@test.com",
            "old_password": self.patient_password,
            "new_password": "NewStrongPass123!",
            "new_password_confirm": "Mismatch123!",
        }

        response = self.client.post(
            self.change_password_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.patient_user.refresh_from_db()
        self.assertTrue(self.patient_user.check_password(self.patient_password))