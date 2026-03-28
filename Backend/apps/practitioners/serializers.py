from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.services.models import Service
from .models import Practitioner, PractitionerService

User = get_user_model()


class PractitionerServiceSerializer(serializers.ModelSerializer):
    service_id = serializers.IntegerField(source="service.id", read_only=True)
    service_name = serializers.CharField(source="service.name", read_only=True)
    duration_minutes = serializers.IntegerField(
        source="service.duration_minutes",
        read_only=True,
    )
    price = serializers.DecimalField(
        source="service.price",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = PractitionerService
        fields = (
            "service_id",
            "service_name",
            "duration_minutes",
            "price",
        )


class PractitionerSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    services = PractitionerServiceSerializer(
        source="services_offered",
        many=True,
        read_only=True,
    )

    class Meta:
        model = Practitioner
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "specialty",
            "bio",
            "clinic_name",
            "phone",
            "services",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class PractitionerCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)

    service_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Practitioner
        fields = (
            "email",
            "password",
            "first_name",
            "last_name",
            "specialty",
            "bio",
            "clinic_name",
            "phone",
            "service_ids",
        )

    def create(self, validated_data):
        service_ids = validated_data.pop("service_ids", [])

        user = User.objects.create_user(
            email=validated_data.pop("email"),
            password=validated_data.pop("password"),
            first_name=validated_data.pop("first_name"),
            last_name=validated_data.pop("last_name"),
            role="PRACTITIONER",
        )

        practitioner = Practitioner.objects.create(
            user=user,
            **validated_data,
        )

        services = Service.objects.filter(id__in=service_ids)

        for service in services:
            PractitionerService.objects.create(
                practitioner=practitioner,
                service=service,
            )

        return practitioner


class PractitionerUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", required=False)
    first_name = serializers.CharField(source="user.first_name", required=False)
    last_name = serializers.CharField(source="user.last_name", required=False)

    service_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )

    services = PractitionerServiceSerializer(
        source="services_offered",
        many=True,
        read_only=True,
    )

    class Meta:
        model = Practitioner
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "specialty",
            "bio",
            "clinic_name",
            "phone",
            "service_ids",
            "services",
            "created_at",
        )
        read_only_fields = ("id", "created_at", "services")

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        service_ids = validated_data.pop("service_ids", None)

        user = instance.user

        if "email" in user_data:
            user.email = user_data["email"]
            if hasattr(user, "username"):
                user.username = user_data["email"]

        if "first_name" in user_data:
            user.first_name = user_data["first_name"]

        if "last_name" in user_data:
            user.last_name = user_data["last_name"]

        user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if service_ids is not None:
            PractitionerService.objects.filter(practitioner=instance).delete()

            services = Service.objects.filter(id__in=service_ids)

            for service in services:
                PractitionerService.objects.create(
                    practitioner=instance,
                    service=service,
                )

        return instance