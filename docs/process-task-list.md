# Execution Log

## Working Style
- Keep diffs small; no drive-by refactors.
- Tests first where possible; commit in logical slices.
- Split tasks if they grow.

---

## Example Block

**Task ID**: P1-T2 — Wire `WeeklyPlanView` with ETag

**Context**
- Goal: 304 when plan unchanged.
- Files: `backend/tracker/views.py`, `backend/tracker/urls.py`, `backend/tracker/weekly_plan.py`.

**Cursor Prompt**
```markdown
Make the smallest edits to add `WeeklyPlanView` with ETag.
Files: backend/tracker/views.py, backend/tracker/urls.py
Constraints:
- Use @condition(etag_func=...) to compute ETag from (user.pk, profile.plan_version, profile.updated_at)
- Return Response(build_plan_for_user(request.user))
- Provide minimal diffs only.
```

**Manual Checks**
- First GET → 200 + ETag.
- GET with If-None-Match → 304.
- Updating profile invalidates ETag (200 + new body).

**Status**: ☐ Todo ☐ In-Progress ☑ Done

---

## Snippet Library

### ETag helper (server)
```python
import hashlib
def plan_etag_components(user):
    p = getattr(user, 'profile', None)
    base = f"{user.pk}:{getattr(p,'plan_version',0)}:{getattr(p,'updated_at',user.date_joined).isoformat()}"
    return hashlib.md5(base.encode()).hexdigest()
```

### Idempotency guard (sketch)
```python
from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import IdempotencyRecord

@transaction.atomic
def idempotent(request, key: str, fingerprint: str, on_first_call):
    rec, created = IdempotencyRecord.objects.select_for_update().get_or_create(
        user=request.user, key=key, defaults={'fingerprint': fingerprint}
    )
    if not created and rec.fingerprint != fingerprint:
        raise ValidationError('Idempotency conflict')
    if created:
        obj = on_first_call()
        rec.response_ref = str(getattr(obj, 'pk', ''))
        rec.save(update_fields=['response_ref'])
        return obj
    # fetch by rec.response_ref as needed
```

### Client conditional GET (sketch)
```javascript
let cache = { etag: null, data: null };
export async function loadPlan(){
  const headers = {};
  if (cache.etag) headers['If-None-Match'] = cache.etag;
  const res = await fetch('/api/v1/weekly-plan/', { headers, credentials: 'include' });
  if (res.status === 304) return cache.data;
  const etag = res.headers.get('ETag');
  const data = await res.json();
  cache = { etag, data };
  return data;
}
```

### Optimistic set log (sketch)
```javascript
export function logSetOptimistic(sessionId, payload){
  const key = crypto.randomUUID();
  uiApplySet(payload); // immediate
  queue.enqueue({
    url: `/api/v1/sessions/${sessionId}/sets/`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(payload),
    credentials: 'include'
  });
}
```

---

## Work Log

- **P1-T1** Add weekly_plan.py generator — **Done**
- **P1-T2** WeeklyPlanView + ETag — **Done**
- **P1-T3** Client conditional GET — **Done**
- **P2-T4** Model updates for sessions — **Done**
- **P2-T5** Idempotency storage — *Todo*
- **P2-T6** Session ViewSet + sets action — **Done**
- **P3-T7** Set-card UI — **Done**
- **P3-T8** Offline queue — *Todo*
- **P4-T9** Progression engine — *Todo*
- **P4-T10** Progression tests — *Todo*
- **P5-T11** ETag on summaries — *Todo*
- **P5-T12** Body map refresh — *Todo*
- **P6-T13** Coach Agent — *Todo*
- **P6-T14** Workout Copilot — *Todo*
- **P7-T15** OpenAPI — *Todo*
- **P7-T16** README — *Todo*
- **P8-T17** CI — *Todo*
- **P8-T18** Tracing — *Todo*
