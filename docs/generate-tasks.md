# Task Breakdown (Phased, atomic, testable)

## Phase 1 — Weekly Plan + ETag
1. **Add plan generator**
   - Files: `backend/tracker/weekly_plan.py`
   - DOD: `build_plan_for_user(user)` returns structure from PRD.
2. **Wire `WeeklyPlanView` with ETag**
   - Files: `backend/tracker/views.py`, `backend/tracker/urls.py`
   - DOD: `@condition(etag_func=...)` returns 304 when ETag matches.
3. **Client conditional GET**
   - Files: `MAR/js/weekly-schedule.js`
   - DOD: Send `If-None-Match`, reuse cache on 304.

## Phase 2 — Sessions + Idempotency
4. **Model updates**
   - Files: `backend/tracker/models.py`
   - Add: `WorkoutSession.status/split_day/summary`, timestamps; ensure `StrengthSet` has `exercise_id,set_index,reps,weight_kg,rpe`.
5. **Idempotency storage**
   - Files: `backend/tracker/models.py` (record) OR `backend/tracker/utils/idempotency.py`
   - DOD: Same key + same payload → same result; key + different payload → 409/400.
6. **Session ViewSet + sets action**
   - Files: `backend/tracker/serializers.py`, `backend/tracker/views.py`, `backend/tracker/urls.py`
   - DOD: POST create, POST sets, PATCH end; permissions + throttles.

## Phase 3 — Optimistic UI + Styling
7. **Set-card UI**
   - Files: `about.html` (styles), `MAR/js/workout.js` (renderer)
   - DOD: 4-col card grid; ✓ toggles; keyboard reachable.
8. **Offline queue**
   - Files: `MAR/js/offline-queue.js`, `MAR/js/workout.js`
   - DOD: Enqueue on network error/offline; replay on reconnect; retry surface.

## Phase 4 — Auto-Progression
9. **Progression engine**
   - Files: `backend/tracker/services/progression.py` (or `session_manager.py`)
   - DOD: finalize computes next weights; persisted in `session.summary`.
10. **Unit tests (edge cases)**
    - Files: `backend/tracker/tests/test_progression.py`
    - DOD: advance / hold / deload scenarios pass.

## Phase 5 — Progress Page Enhancements
11. **ETag on summaries**
    - Files: `backend/tracker/views.py`
    - DOD: `/api/v1/progress/summary/` supports ETag; client obeys 304.
12. **Body map refresh**
    - Files: `progress.html`, `MAR/js/progress.js`, SVG asset
    - DOD: Improved labels, focus rings, keyboard nav.

## Phase 6 — Agents (toggle)
13. **Coach Agent**
    - Files: `backend/agents/coach.py`, minimal frontend launcher
    - DOD: Tools: `getProfile`, `getExercises`, `saveWeeklyPlan`; confirm before writes.
14. **Workout Copilot**
    - Files: `backend/agents/copilot.py`, Active Workout panel
    - DOD: Suggest next set → one-tap log (guarded).

## Phase 7 — Docs & Schema
15. **OpenAPI**
    - Files: `settings.py`, `urls.py`, `PROJECT_SUMMARY.md`
    - DOD: Swagger/Redoc render new routes.
16. **README fragments**
    - Env vars, run scripts, deploy notes.

## Phase 8 — CI & Telemetry
17. **CI**
    - Run tests + lint on PRs.
18. **Tracing**
    - Log request timings + tool calls.

---

## Per-task template (paste in PR)
- **Task**: <short name>
- **Scope**: <files>
- **Contract**: <request/response or UI spec>
- **DOD**: <tests, 304 observed, etc.>
- **Notes**: <risks/rollbacks>
