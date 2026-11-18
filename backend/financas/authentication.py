from rest_framework.authentication import SessionAuthentication


class SessaoAuthentication(SessionAuthentication):
    """Sessão do Django que responde 401 (não 403) sem login (ADR-008)."""

    def authenticate_header(self, request):
        return "Session"
