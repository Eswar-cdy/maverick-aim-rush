# Frontend
- Use React components in `frontend/app/` with functional components and hooks.
- Keep API calls in a dedicated client; no inline fetches in components.
- Validate props with TypeScript or PropTypes if TypeScript not available.
- Use AbortController for request cancellation and timeouts.
- Handle loading, error, and empty states consistently.
- Prefer hooks over class components.
- Keep fetch logic in `frontend/app/src/api/`; avoid inline fetch in components.
