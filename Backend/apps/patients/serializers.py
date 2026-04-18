from rest_framework import serializers
from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", required=False)
    first_name = serializers.CharField(source="user.first_name", required=False)
    last_name = serializers.CharField(source="user.last_name", required=False)

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

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})

        user = instance.user

        if "email" in user_data:
            user.email = user_data["email"]

        if "first_name" in user_data:
            user.first_name = user_data["first_name"]

        if "last_name" in user_data:
            user.last_name = user_data["last_name"]

        user.save()

        instance.phone = validated_data.get("phone", instance.phone)
        instance.date_of_birth = validated_data.get(
            "date_of_birth",
            instance.date_of_birth,
        )
        instance.address = validated_data.get("address", instance.address)
        instance.save()

        return instance


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