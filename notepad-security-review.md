# Notepad: Maverick – Security Review (Production-Ready)

Goal
Quick, practical safety pass before merge.

Scope files
- `backend/tracker/permissions.py`, `views.py`, `serializers.py`, `csrf_jwt.py`
- `backend/maverick_backend/settings.py`, `backend/production_settings.py`
- `backend/tracker/urls.py`

Checklist
1) Auth/Permissions
- Default: least privilege; explicit permission classes on viewsets.
- Staff/admin-only ops enforced server-side.

2) Serializer hardening
- Explicit `fields`, `read_only_fields`, `write_only` for secrets.
- Validate business rules; block over-posting.

3) CSRF/JWT/Session
- Align with `csrf_jwt.py` patterns; avoid mixing modes inadvertently.
- Cookies: `Secure`, `HttpOnly`, `SameSite` when using cookies.

4) Throttling/Abuse
- Apply DRF throttling for public/high-traffic endpoints; reasonable rates.

5) Pagination/Caps
- Enforce default `PAGE_SIZE`; cap `page_size` query param; safe `ordering_fields`.

6) CORS/Hosts
- No wildcards in prod; explicit origins; correct `ALLOWED_HOSTS`.

7) Uploads/Media
- Validate content type, extension, and size; sanitize images; store safely.

8) Security headers/Transport
- HTTPS at edge; proxy headers configured.
- Add/verify HSTS and common headers if applicable.

9) Data exposure
- Only intended fields in responses; avoid leaking internals.

10) Tests
- Permission denials, invalid payloads, throttling behaviors.

Minimal Cursor prompt
```markdown
Perform a focused security review on changed endpoints.
Files: backend/tracker/{views,serializers,permissions}.py, backend/tracker/csrf_jwt.py, backend/maverick_backend/settings.py, backend/production_settings.py, backend/tracker/urls.py
Confirm:
- Correct permission classes, safe throttling, capped pagination/ordering.
- Serializer prevents over-posting and hides sensitive fields.
- CSRF/JWT usage matches existing patterns; CORS/ALLOWED_HOSTS safe for prod.
Provide minimal diffs only for fixes; avoid refactors.
```

Output template
- Endpoint: <path>
- Issue: <short>
- Risk: <low/med/high>
- Fix: <1–2 lines>
- Diff: <minimal edit or exact lines>

Security Checklist Items
```python
# Example security checks to verify:

# 1. Permissions
class MyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]  # Least privilege

# 2. Serializer hardening
class MySerializer(serializers.ModelSerializer):
    class Meta:
        model = MyModel
        fields = ['id', 'name', 'public_field']  # Explicit fields only
        read_only_fields = ['id', 'created_at']  # Prevent modification
        write_only_fields = ['password']  # Hide secrets

# 3. Throttling
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}

# 4. CORS settings
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
CORS_ALLOW_CREDENTIALS = True

# 5. File upload validation
def validate_file_upload(file):
    allowed_types = ['image/jpeg', 'image/png']
    max_size = 5 * 1024 * 1024  # 5MB
    
    if file.content_type not in allowed_types:
        raise ValidationError("Invalid file type")
    if file.size > max_size:
        raise ValidationError("File too large")
```

Common Security Issues to Check
1. **Over-posting**: Serializer allows unexpected fields
2. **Missing permissions**: Endpoints accessible without proper auth
3. **Data leakage**: Sensitive fields in responses
4. **No rate limiting**: Endpoints vulnerable to abuse
5. **Unsafe file uploads**: No validation on uploaded files
6. **CORS misconfiguration**: Too permissive origins
7. **Missing CSRF protection**: Forms vulnerable to CSRF
8. **Insecure cookies**: Missing security flags
9. **SQL injection**: Raw queries without parameterization
10. **XSS vulnerabilities**: Unescaped user input in templates
