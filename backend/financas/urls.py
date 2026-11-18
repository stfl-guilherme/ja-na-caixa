from django.urls import path
from rest_framework.routers import DefaultRouter

from financas import views, views_auth

router = DefaultRouter(trailing_slash=True)
router.include_root_view = False
router.register("categorias", views.CategoriaViewSet, basename="categoria")

urlpatterns = [
    path("auth/csrf/", views_auth.CsrfView.as_view(), name="auth-csrf"),
    path("auth/login/", views_auth.LoginView.as_view(), name="auth-login"),
    path("auth/demo/", views_auth.DemoLoginView.as_view(), name="auth-demo"),
    path("auth/logout/", views_auth.LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", views_auth.MeView.as_view(), name="auth-me"),
    *router.urls,
]
