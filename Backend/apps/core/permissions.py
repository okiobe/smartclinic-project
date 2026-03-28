from rest_framework.permissions import BasePermission


class IsAdminUserRole(BasePermission):
    """
    Autorise uniquement les utilisateurs authentifiés
    ayant le rôle ADMIN.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) == "ADMIN"
        )