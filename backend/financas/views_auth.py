from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


def _usuario_json(user) -> dict:
    return {"id": user.id, "username": user.username}


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    """Define o cookie csrftoken antes do primeiro POST (ADR-002)."""

    authentication_classes: list = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    authentication_classes: list = []
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username") or ""
        password = request.data.get("password") or ""
        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {"detail": "Usuário ou senha inválidos."}, status=status.HTTP_400_BAD_REQUEST
            )
        login(request, user)
        return Response(_usuario_json(user))


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    def get(self, request):
        return Response(_usuario_json(request.user))
