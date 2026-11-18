from django.urls import path

from financas import views_auth

urlpatterns = [
    path("auth/csrf/", views_auth.CsrfView.as_view(), name="auth-csrf"),
    path("auth/login/", views_auth.LoginView.as_view(), name="auth-login"),
    path("auth/demo/", views_auth.DemoLoginView.as_view(), name="auth-demo"),
    path("auth/logout/", views_auth.LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", views_auth.MeView.as_view(), name="auth-me"),
]
