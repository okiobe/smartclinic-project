from django.conf import settings
from django.contrib.auth import login, logout
from django.core.mail import send_mail
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    ChangePasswordFromLoginSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()

        full_name = f"{user.first_name} {user.last_name}".strip() or user.email
        message = (
            f"Bonjour {full_name},\n\n"
            f"Votre compte SmartClinic a été créé avec succès.\n\n"
            f"Merci,\n"
            f"L'équipe SmartClinic"
        )

        send_mail(
            subject="Bienvenue sur SmartClinic",
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[user.email],
            fail_silently=False,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        login(request, user)

        return Response(
            {
                "message": "Connexion réussie.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ChangePasswordFromLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ChangePasswordFromLoginSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"message": "Mot de passe modifié avec succès. Vous pouvez maintenant vous connecter."},
            status=status.HTTP_200_OK,
        )


class GetCSRFToken(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"success": "CSRF cookie set"})


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(
            {"message": "Déconnexion réussie."},
            status=status.HTTP_200_OK,
        )