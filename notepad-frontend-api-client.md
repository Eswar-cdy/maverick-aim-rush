# Notepad: Maverick – Frontend API Client (Production-Ready)

Goal
Centralize fetch logic with timeouts/retry, normalized errors, and optional ETag caching; expose hooks for components.

Locations
- `frontend/app/src/api/` (base client + per-resource modules + hooks)

Inputs
- Endpoint(s) + verbs:
- Auth mode (Bearer / cookie):
- Response schema (brief):
- Cache policy (ETag / If-None-Match?):
- Timeout (default 10s):

Checklist
1) Base client (`client.js` or `client.ts`)
- Read `BASE_URL` from env.
- Auth helper (JWT/cookie).
- Timeout via `AbortController` (default 10s).
- Retry once on network errors (no retry for 4xx).
- ETag support: send `If-None-Match`; if 304, use cached data.
- Consistent return shape: `{ data, error, status, etag? }`.

2) Resource modules (`/api/<resource>.js`)
- Thin wrappers: `getX`, `createX`, `updateX`, `deleteX`.
- JSDoc or TS types for requests/responses.

3) Hooks (`/api/use<Resource>.js`)
- `use<Resource>({ params })` → `{ data, loading, error, refetch }`.
- Cancel in-flight requests on unmount.
- Single retry on network error.

4) UI integration
- Components import hooks (no inline fetch).
- Render loading, error, empty, and success states.

5) Tests (recommended)
- Mock fetch: success, 4xx, 5xx, timeout/abort.
- Hook behavior: cancel on unmount; retry on network error.

Minimal Cursor prompt
```markdown
Create frontend/app/src/api/client.js with get/post/patch/del that:
- Reads BASE_URL from env; adds auth header; 10s timeout via AbortController.
- Retries once on network errors; returns {data, error, status, etag?}.
Add frontend/app/src/api/<resource>.js wrappers for the new endpoints.
Add frontend/app/src/api/use<Resource>.js hook that fetches with cancel + single retry.
Provide minimal diffs only; keep imports/formatting; avoid refactors.
```

Review checklist
- No inline fetches in components.
- Error objects consistent and user-friendly.
- Abort cancels on unmount; network-only retry works.
- Optional ETag flow handled when backend supports it.
- Env-based base URL; no hardcoded hosts.

Example Implementation
```javascript
// frontend/app/src/api/client.js
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseURL = BASE_URL;
  }

  async request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data, error: null, status: response.status };
    } catch (error) {
      clearTimeout(timeoutId);
      return { data: null, error: error.message, status: 0 };
    }
  }

  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  get(endpoint) { return this.request(endpoint); }
  post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
  patch(endpoint, data) { return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(data) }); }
  del(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
}

export const apiClient = new ApiClient();
```

```javascript
// frontend/app/src/api/useResource.js
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from './client';

export function useResource(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const { data: result, error: err } = await apiClient.get(endpoint);
    
    if (err) {
      setError(err);
    } else {
      setData(result);
    }
    
    setLoading(false);
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```
