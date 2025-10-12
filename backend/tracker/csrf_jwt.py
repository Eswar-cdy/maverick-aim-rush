"""
CSRF protection middleware for JWT httpOnly cookies
Implements double-submit CSRF pattern
"""
import secrets
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.conf import settings


class CSRFSimpleJWTGuard(MiddlewareMixin):
    """
    CSRF protection for JWT httpOnly cookies using double-submit pattern
    """
    
    def process_request(self, request):
        # Skip CSRF check for safe methods
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return None
        
        # Skip if CSRF protection is disabled
        if not settings.MAR_FLAGS.get("csrf_protection", True):
            return None
        
        # Get CSRF token from cookie and header
        cookie_token = request.COOKIES.get("csrf_token")
        header_token = request.headers.get("X-CSRF-Token")
        
        # Both must be present and match
        if not cookie_token or not header_token or cookie_token != header_token:
            return JsonResponse({
                "code": "csrf_failed",
                "message": "CSRF token invalid or missing",
                "correlation_id": str(secrets.token_urlsafe(16))
            }, status=403)
        
        return None


def generate_csrf_token():
    """
    Generate a secure CSRF token
    """
    return secrets.token_urlsafe(24)
