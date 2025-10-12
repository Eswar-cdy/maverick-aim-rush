# Project: Maverick Aim Rush (Workout & Progress Platform)

## Vision
A fast, reliable fitness tracker that feels pro: PPL weekly planning, optimistic workout logging (even offline), meaningful progress insights, and optional AI agents (coach/copilot). Production-safe: versioned APIs, ETag caching, idempotent writes, and tests.

## Personas
- **Everyday lifter (primary)** — Wants simple plan, quick logging, clear progress. Mobile-first.
- **Returning athlete** — Cares about progression rules, PRs, and weekly structure.
- **Coach (secondary)** — Programs for clients; wants predictable behavior and exportable data.

## Non-Goals (for now)
- Automated nutrition coaching (nutrition logging lives elsewhere).
- Complex periodization beyond simple PPL rules.
- Full social graph (basic activity feed only).

---

## System Standards
- **Backend**: Django + DRF; all new routes under **`/api/v1/`** (ViewSets + Routers).
- **Auth**: JWT (cookie or Bearer); CSRF integration per `csrf_jwt.py`.
- **Caching**: Conditional GET via **ETag** for read-heavy endpoints (weekly plan, summaries, exercise catalog).
- **Writes**: **Idempotency-Key** header for POST/PATCH that can be retried (sessions, sets, photos).
- **Pagination**: Global default + page size cap; safe `ordering_fields`.
- **Security**: Least-privilege permissions, throttling for public/high-traffic, strict CORS/ALLOWED_HOSTS.
- **Frontend**: Vanilla HTML + UnoCSS; small JS modules in `MAR/js/*`; optimistic UI + offline queue.
- **A11y**: ARIA tabs, keyboard support, visible focus, contrast-safe colors.

---

## Core Features

### 1) Weekly Plan (PPL) with ETag
**Goal**: 7-day PPL plan tailored to profile (goal, days, equipment); instant repeat loads.
- **Endpoint**: `GET /api/v1/weekly-plan/`
- **ETag**: Hash of `(user_id, plan_version, profile_updated_at)`
- **Shape (example)**:
```json
{
  "week_start": "YYYY-MM-DD",
  "split": "PPL",
  "days": {
    "Day1": [
      {"id":"bench_press","name":"Barbell Bench Press","sets":[{"reps":8,"weight":60,"rpe":8}], "unit":"kg"}
    ],
    "Day2": [], "Day3": [], "Day4": [], "Day5": [], "Day6": [], "Day7": []
  },
  "plan_version": 3
}
```

### 2) Sessions + Set Logging (Idempotent, Optimistic)

**Goal**: Start → log sets → end session with instant UI and durable writes.
- **Models (existing/assumed)**:
  - `WorkoutSession(user, status, split_day, started_at, ended_at, summary JSON)`
  - `StrengthSet(session FK, exercise_id, set_index, reps, weight_kg, rpe)`
  - `UserProfile(unit_system, distance_unit, goal, equipment[], plan_version, updated_at)`
  - `ExerciseCatalog(slug, name, muscle_group, equipment, defaults)`
- **Endpoints**:
  - `POST /api/v1/sessions/` (create/open)
  - `POST /api/v1/sessions/{id}/sets/` (log set)
  - `PATCH /api/v1/sessions/{id}/` (end session)
- **Headers**: `Idempotency-Key: <uuid>` on writes.
- **Optimistic UI**: Add set immediately; enqueue write; reconcile on response.

### 3) Auto-Progression (server-side, on finalize)

**Rules on end-session**:
- If all working sets hit target reps and avg RPE ≤ 8 → +2.5 kg (upper) or +5 kg (lower) next time.
- If short on reps or avg RPE ≥ 9 → hold; two stalls consecutively → deload 5–7.5%.
- Persist next prescription in `session.summary.next_prescription`.

### 4) Progress (fast, legible)
- Weight/body-fat chart (decimation), PR tiles, body map with clear labels.
- Photos grid + before/after slider.
- ETag for summaries, optimistic adds, offline queue for writes.

### 5) Agents (toggleable)
- **Coach Agent**: Build/refresh weekly plan via tools (`getProfile`, `getExercises`, `saveWeeklyplan`) → confirm before writes.
- **Workout Copilot**: Suggest next set during active session, one-tap log.
- **Guardrails**: least privilege; explicit approvals for write tools.

---

## Endpoints (current + planned)
- **Profile/Units**: `GET /api/v1/profile/me/`, `PATCH /api/v1/profile/`
- **Plan**: `GET /api/v1/weekly-plan/`
- **Exercises**: `GET /api/v1/exercises/?q=&page_size=`
- **Recommendations**: `GET /api/v1/recommendations/` (optional)
- **Sessions**:
  - `POST /api/v1/sessions/`
  - `POST /api/v1/sessions/{id}/sets/`
  - `PATCH /api/v1/sessions/{id}/`
  - `GET /api/v1/sessions/?page_size=`
- **Progress**: `GET /api/v1/progress/summary/` (ETag)
- **Onboarding**: `GET /api/onboarding/status` (dev-only path already used)

---

## Acceptance Criteria
- Weekly plan returns 304 on unchanged profile/plan.
- Session writes are duplicate-safe with `Idempotency-Key`.
- Set ✓ toggles feel instant; errors surface retry; offline queue replays on reconnect.
- Auto-progression outputs deterministic and match rules.
- Tabs keyboard-operable; visible focus; labels readable.
- Tests for serializers, viewsets, progression math, idempotency behavior.
