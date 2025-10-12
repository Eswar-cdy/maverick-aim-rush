# Notepad: Maverick – Add DRF Endpoint (Production-Ready)

Goal
Add a new DRF endpoint with model/serializer/viewset/router/tests, small diffs, production-safe defaults.

Context files
- `backend/tracker/models.py`, `serializers.py`, `views.py`, `urls.py`, `permissions.py`
- `backend/maverick_backend/settings.py` (pagination/throttling)
- `backend/production_settings.py`
- `backend/tracker/tests/`, `backend/tracker/test_api.py`
- `PROJECT_SUMMARY.md`

Inputs (fill before running)
- Resource name (singular/plural):
- Model fields (name:type:constraints):
- Permissions (who can read/write):
- Page size cap (default 25, max 100):
- Filter/search/order fields?:
- Derived/read-only fields?:

Step-by-step
1) Model
- Add/extend model; prefer additive fields to avoid downtime.
- Migrations:
  - `python backend/manage.py makemigrations tracker`
  - `python backend/manage.py migrate`

2) Serializer
- Use `ModelSerializer` with explicit `fields` and `read_only_fields`.
- Add `validate_<field>`/`validate` for business rules.
- Optional computed fields: mark read-only.

3) ViewSet
- Use `ModelViewSet` (or `ReadOnlyModelViewSet`).
- Apply permission classes (least privilege).
- Enable filters:
  - `filterset_fields`, `search_fields`, `ordering_fields` (ensure django-filter).
- Pagination: use global default; cap page size.
- Performance: override `get_queryset()` to add `select_related`/`prefetch_related`.

4) Router / Versioning (MANDATORY)
- **REQUIRED**: Register via DRF router under `/api/v1/` path only.
- Keep namespaced `urls.py` consistent with existing routes.
- No exceptions: all new endpoints must be versioned.

5) Schema / Docs (MANDATORY)
- Ensure schema generation (drf-spectacular or DRF schema) surfaces the new route.
- Verify Swagger/Redoc page renders updated spec.
- Update `PROJECT_SUMMARY.md` (path, verbs, auth, schema snippet).

6) Tests (MANDATORY)
- Serializer: valid payloads accepted; invalid/over-posting rejected.
- ViewSet: list/detail/create/update/delete; permission enforcement.
- Pagination/filter/search/order behavior.
- **REQUIRED**: Schema/contract snapshot test against OpenAPI to prevent frontend/backend drift.

7) Safety / Throttling / Idempotency
- Add throttling for public/high-traffic endpoints.
- If POST can be retried, support an Idempotency-Key to prevent duplicates.

Minimal Cursor prompt
```markdown
Make the smallest edits to add a DRF endpoint for "<Resource>".
Files: backend/tracker/{models,serializers,views,urls}.py, backend/tracker/tests/
Constraints:
- ModelViewSet + router under /api/v1/ (MANDATORY - no exceptions).
- Validate in serializer; set read_only_fields; prevent over-posting.
- Enable filterset_fields/search_fields/ordering_fields; use global pagination with page size cap.
- Add throttling if endpoint is public.
- Optimize get_queryset() with select_related/prefetch_related where relevant.
- Add schema snapshot test to prevent frontend/backend drift.
- Keep imports/formatting; no refactors. Provide minimal diffs only.
```

Review checklist
- Serializer blocks unknown fields and enforces constraints.
- Permissions enforced on unsafe actions; denies unauthorized access.
- Pagination stable ordering; page size capped.
- Filter/search/order verified and documented.
- Query count reasonable (N+1 avoided).
- Tests cover negative cases and permissions.
- **Schema snapshot test exists and passes**.
- Schema/docs updated and accessible.
- Migrations applied without data loss.
- **Endpoint is under /api/v1/ path (no exceptions)**.

Rollback
- Remove router entry and ViewSet import; delete serializer; revert model/migration.
- If migration shipped, write reverse migration (drop field/table) or revert commit and re-migrate.

Schema Snapshot Test Example
```python
# backend/tracker/tests/test_schema.py
from django.test import TestCase
from rest_framework.test import APIClient

class SchemaSnapshotTest(TestCase):
    def test_new_endpoint_schema_consistency(self):
        """Ensure new endpoint schema matches expected contract"""
        client = APIClient()
        
        # Get the OpenAPI schema
        response = client.get('/api/schema/')
        self.assertEqual(response.status_code, 200)
        
        schema = response.json()
        
        # Verify your new endpoint exists with expected structure
        paths = schema.get('paths', {})
        endpoint_path = '/api/v1/your-resource/'
        
        self.assertIn(endpoint_path, paths)
        
        # Verify expected methods exist
        endpoint_spec = paths[endpoint_path]
        self.assertIn('get', endpoint_spec)  # list
        self.assertIn('post', endpoint_spec)  # create
        
        # Verify response schema structure
        get_responses = endpoint_spec['get']['responses']
        self.assertIn('200', get_responses)
```
