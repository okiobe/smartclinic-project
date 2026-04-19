from .models import AuditLog


def log_audit_event(
    *,
    user,
    action,
    module,
    object_type,
    object_id=None,
    description="",
):
    AuditLog.objects.create(
        user=user if getattr(user, "is_authenticated", False) else None,
        role=getattr(user, "role", "") if user else "",
        action=action,
        module=module,
        object_type=object_type,
        object_id=object_id,
        description=description,
    )