from rest_framework import serializers
from .models import AvailabilityRule


class AvailabilityRuleSerializer(serializers.ModelSerializer):
    weekday_display = serializers.CharField(
        source="get_weekday_display",
        read_only=True,
    )

    class Meta:
        model = AvailabilityRule
        fields = (
            "id",
            "weekday",
            "weekday_display",
            "start_time",
            "end_time",
            "is_active",
            "created_at",
        )