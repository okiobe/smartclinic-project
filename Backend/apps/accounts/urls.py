from django.urls import path

from .views import (
    RegisterView,
    LoginView,
    MeView,
    LogoutView,
    GetCSRFToken,
    ChangePasswordFromLoginView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("csrf/", GetCSRFToken.as_view(), name="auth-csrf"),
    path(
        "change-password-from-login/",
        ChangePasswordFromLoginView.as_view(),
        name="auth-change-password-from-login",
    ),
]