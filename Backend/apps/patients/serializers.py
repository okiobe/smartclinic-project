from rest_framework import serializers
from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = Patient
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "date_of_birth",
            "address",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class AdminPatientSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = Patient
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "created_at",
        )
        read_only_fields = ("id", "created_at")