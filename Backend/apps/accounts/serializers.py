from django.contrib.auth import authenticate, password_validation
from rest_framework import serializers

from .models import User
from apps.patients.models import Patient


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "role")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "email",
            "first_name",
            "last_name",
            "role",
            "password",
            "password_confirm",
        )
        extra_kwargs = {
            "role": {"read_only": True},
        }

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Les mots de passe ne correspondent pas."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm", None)

        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role=User.Role.PATIENT,
        )

        Patient.objects.create(user=user)

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(
            request=self.context.get("request"),
            email=email,
            password=password,
        )

        if not user:
            raise serializers.ValidationError(
                {"detail": "Email ou mot de passe invalide."}
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "Ce compte est désactivé."}
            )

        attrs["user"] = user
        return attrs


class ChangePasswordFromLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        email = attrs.get("email")
        old_password = attrs.get("old_password")
        new_password = attrs.get("new_password")
        new_password_confirm = attrs.get("new_password_confirm")

        if new_password != new_password_confirm:
            raise serializers.ValidationError(
                {"new_password_confirm": "Les mots de passe ne correspondent pas."}
            )

        user = authenticate(
            request=self.context.get("request"),
            email=email,
            password=old_password,
        )

        if not user:
            raise serializers.ValidationError(
                {"old_password": "L'ancien mot de passe est incorrect."}
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "Ce compte est désactivé."}
            )

        password_validation.validate_password(new_password, user=user)

        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user