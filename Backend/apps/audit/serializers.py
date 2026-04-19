from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_display_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = (
            "id",
            "user",
            "user_email",
            "user_display_name",
            "role",
            "action",
            "module",
            "object_type",
            "object_id",
            "description",
            "created_at",
        )
        read_only_fields = fields

    def get_user_display_name(self, obj):
        if not obj.user:
            return "Système"

        first_name = getattr(obj.user, "first_name", "") or ""
        last_name = getattr(obj.user, "last_name", "") or ""
        full_name = f"{first_name} {last_name}".strip()

        return full_name or obj.user.email