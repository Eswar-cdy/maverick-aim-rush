# Auth/Security
- Follow JWT/CSRF in `tracker/csrf_jwt.py`.
- Enforce `permissions.py`; add throttling for public endpoints.
- Never log secrets; use env vars.
- Validate inputs in serializers; avoid business logic in views.
- Return paginated responses for list endpoints by default.
- Use secure cookies (HttpOnly, Secure, SameSite) when using cookies.
- Apply DRF throttling for public/high-traffic endpoints.
- Validate file uploads (type, size, path) for media uploads.
- Ensure CORS/ALLOWED_HOSTS are safe for production.
