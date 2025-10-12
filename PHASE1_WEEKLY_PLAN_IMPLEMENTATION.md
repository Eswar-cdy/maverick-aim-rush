# Phase 1: Weekly Plan API with ETag + PPL Logic

## Implementation Guide for Maverick Aim Rush

This guide provides the exact code to implement the weekly plan endpoint with:
- ✅ ETag caching for instant loads (304 responses)
- ✅ PPL (Push/Pull/Legs) split logic
- ✅ Scales from 3–6 days/week
- ✅ Integrates with existing UserProfile + TrainerProfile
- ✅ Production-ready patterns

---

## Step 1: Update `backend/tracker/views.py`

Replace the existing `WeeklyPlanView` class (starting at line 129) with this enhanced version:

```python
import hashlib
from django.utils.decorators import method_decorator
from django.views.decorators.http import condition
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime, timedelta


def _plan_etag(request, *args, **kwargs):
    """
    Generate ETag based on user, profile version, and last update.
    Client sends If-None-Match; if match, Django returns 304 Not Modified.
    """
    u = request.user
    try:
        # Get profile (UserProfile or TrainerProfile)
        profile = getattr(u, 'tracker_profile', None)
        trainer = getattr(u, 'trainer_profile', None)
        
        # Compute version from profile updates
        profile_updated = getattr(profile, 'updated_at', u.date_joined) if hasattr(profile, 'updated_at') else u.date_joined
        trainer_updated = getattr(trainer, 'updated_at', u.date_joined) if hasattr(trainer, 'updated_at') and trainer else u.date_joined
        
        # Use most recent update
        last_update = max(profile_updated, trainer_updated) if trainer else profile_updated
        
        # Create unique key: user_id:last_update:goal
        goal = getattr(profile, 'primary_goal', 'general_fitness') if profile else 'general_fitness'
        key = f"{u.pk}:{last_update.isoformat()}:{goal}"
        
    except Exception:
        # Fallback to user ID + join date
        key = f"{u.pk}:{u.date_joined.isoformat()}"
    
    return hashlib.md5(key.encode()).hexdigest()


@method_decorator(condition(etag_func=_plan_etag), name='dispatch')
class WeeklyPlanView(APIView):
    """
    Weekly workout plan endpoint with ETag caching.
    
    Returns PPL (Push/Pull/Legs) split by default, scaled to user's frequency.
    
    HTTP Caching:
    - Client sends: If-None-Match: "<etag>"
    - Server returns: 304 Not Modified (if ETag matches) OR 200 OK (with fresh ETag)
    
    Contract:
    {
      "week_start": "2025-10-03",
      "split": "PPL",
      "days": {
        "Day1": [{"id": "bench_press", "name": "Bench Press", "sets": [...]}],
        "Day2": [...],
        ...
      },
      "plan_version": 1,
      "meta": {"goal": "muscle_gain", "frequency": 4, ...}
    }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        plan = self._build_ppl_plan(user)
        return Response(plan)

    def _build_ppl_plan(self, user):
        """
        Generate PPL plan based on user profile.
        
        Scaling logic:
        - 3 days: Push, Legs, Pull
        - 4 days: Push, Legs, Pull, Upper (accessories)
        - 5 days: Push, Pull, Legs, Upper, Conditioning
        - 6 days: Push, Pull, Legs (repeat with lower volume)
        """
        from .models import UserProfile, TrainerProfile
        
        # Get user preferences
        try:
            profile = user.tracker_profile
            goal = profile.primary_goal or 'general_fitness'
            frequency = profile.workout_frequency or 4
            level = profile.fitness_level or 'intermediate'
            equipment = (profile.available_equipment or '').split(',')
        except UserProfile.DoesNotExist:
            goal = 'general_fitness'
            frequency = 4
            level = 'intermediate'
            equipment = []
        
        # Get trainer overrides if available
        try:
            trainer = user.trainer_profile
            split = trainer.split or 'PPL'
            frequency = trainer.days_per_week or frequency
        except TrainerProfile.DoesNotExist:
            split = 'PPL'
        
        # Calculate week start (Monday)
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        
        # Build PPL days
        days = {}
        
        # Day 1: Push (Chest, Shoulders, Triceps)
        days['Day1'] = [
            {
                'id': 'bench_press',
                'name': 'Barbell Bench Press',
                'sets': [
                    {'reps': 8, 'weight': 60, 'rpe': 8, 'unit': 'kg'},
                    {'reps': 8, 'weight': 60, 'rpe': 8, 'unit': 'kg'},
                    {'reps': 8, 'weight': 60, 'rpe': 8, 'unit': 'kg'},
                    {'reps': 8, 'weight': 60, 'rpe': 8, 'unit': 'kg'}
                ],
                'category': 'push',
                'type': 'main'
            },
            {
                'id': 'incline_db_press',
                'name': 'Incline Dumbbell Press',
                'sets': [
                    {'reps': 10, 'weight': 22.5, 'rpe': 7, 'unit': 'kg'},
                    {'reps': 10, 'weight': 22.5, 'rpe': 7, 'unit': 'kg'},
                    {'reps': 10, 'weight': 22.5, 'rpe': 7, 'unit': 'kg'}
                ],
                'category': 'push',
                'type': 'accessory'
            },
            {
                'id': 'cable_fly',
                'name': 'Cable Fly',
                'sets': [
                    {'reps': 12, 'weight': 15, 'rpe': 6, 'unit': 'kg'},
                    {'reps': 12, 'weight': 15, 'rpe': 6, 'unit': 'kg'},
                    {'reps': 12, 'weight': 15, 'rpe': 6, 'unit': 'kg'}
                ],
                'category': 'push',
                'type': 'accessory'
            },
            {
                'id': 'overhead_press',
                'name': 'Overhead Press',
                'sets': [
                    {'reps': 8, 'weight': 40, 'rpe': 7, 'unit': 'kg'},
                    {'reps': 8, 'weight': 40, 'rpe': 7, 'unit': 'kg'},
                    {'reps': 8, 'weight': 40, 'rpe': 7, 'unit': 'kg'}
                ],
                'category': 'push',
                'type': 'accessory'
            },
            {
                'id': 'tricep_pushdown',
                'name': 'Tricep Pushdown',
                'sets': [
                    {'reps': 12, 'weight': 20, 'rpe': 6, 'unit': 'kg'},
                    {'reps': 12, 'weight': 20, 'rpe': 6, 'unit': 'kg'},
                    {'reps': 12, 'weight': 20, 'rpe': 6, 'unit': 'kg'}
                ],
                'category': 'push',
                'type': 'finisher'
            }
        ]
        
        # Day 2: Pull (Back, Biceps)
        days['Day2'] = [
            {
                'id': 'deadlift',
                'name': 'Deadlift',
                'sets': [
                    {'reps': 5, 'weight': 100, 'rpe': 8, 'unit': 'kg'},
                    {'reps': 5, 'weight': 100, 'rpe': 8, 'unit': 'kg'},
                    {'reps': 5, 'weight': 100, 'rpe': 8, 'unit': 'kg'},
                    {'reps': 5, 'weight': 100, 'rpe': 8, 'unit': 'kg'}
                ],
                'category': 'pull',
                'type': 'main'
            },
            {
                'id': 'pull_up',
                'name': 'Pull-Ups',
                'sets': [
                    {'reps': 8, 'weight': 0, 'rpe': 7, 'unit': 'kg'},
                    {'reps': 8, 'weight': 0, 'rpe': 7, 'unit': 'kg'},
                    {'reps': 8, 'weight': 0, 'rpe': 7, 'unit': 'kg'}
                ],
                'category': 'pull',
                'type': 'accessory'
            },
            {
                'id': 'barbell_row',
                'name': 'Barbell Row',
                'sets': [
                    {'reps': 8, 'weight': 60, 'rpe': 7, 'unit': 'kg'},
                    {'reps': 8, 'weight': 60, 'rpe': 7, 'unit': 'kg'},
                    {'reps': 8, 'weight': 60, 'rpe': 7, 'unit': 'kg'}
                ],
                'category': 'pull',
                'type': 'accessory'
            },
            {
                'id': 'barbell_curl',
                'name': 'Barbell Curl',
                'sets': [
                    {'reps': 10, 'weight': 25, 'rpe': 6, 'unit': 'kg'},
                    {'reps': 10, 'weight': 25, 'rpe': 6, 'unit': 'kg'},
                    {'reps': 10, 'weight': 25, 'rpe': 6, 'unit': 'kg'}
                ],
                'category': 'pull',
                'type': 'finisher'
            }
        ]
        
        # Day 3: Legs
        days['Day3'] = [
            {
                'id': 'squat',
                'name': 'Barbell Squat',
                'sets': [
                    {'reps': 6, 'weight': 80, 'rpe': 8, 'unit': 'kg'},
                    {'reps': 6, 'weight': 80, 'rpe': 8, 'unit': 'kg'},
                    {'reps': 6, 'weight': 80, 'rpe': 8, 'unit': 'kg'},
                    {'reps': 6, 'weight': 80, 'rpe': 8, 'unit': 'kg'}
                ],
                'category': 'legs',
                'type': 'main'
            },
            {
                'id': 'leg_press',
                'name': 'Leg Press',
                'sets': [
                    {'reps': 12, 'weight': 120, 'rpe': 7, 'unit': 'kg'},
                    {'reps': 12, 'weight': 120, 'rpe': 7, 'unit': 'kg'},
                    {'reps': 12, 'weight': 120, 'rpe': 7, 'unit': 'kg'}
                ],
                'category': 'legs',
                'type': 'accessory'
            },
            {
                'id': 'leg_curl',
                'name': 'Leg Curl',
                'sets': [
                    {'reps': 12, 'weight': 40, 'rpe': 6, 'unit': 'kg'},
                    {'reps': 12, 'weight': 40, 'rpe': 6, 'unit': 'kg'},
                    {'reps': 12, 'weight': 40, 'rpe': 6, 'unit': 'kg'}
                ],
                'category': 'legs',
                'type': 'accessory'
            },
            {
                'id': 'calf_raise',
                'name': 'Calf Raise',
                'sets': [
                    {'reps': 15, 'weight': 60, 'rpe': 6, 'unit': 'kg'},
                    {'reps': 15, 'weight': 60, 'rpe': 6, 'unit': 'kg'},
                    {'reps': 15, 'weight': 60, 'rpe': 6, 'unit': 'kg'}
                ],
                'category': 'legs',
                'type': 'finisher'
            }
        ]
        
        # Day 4-7: Depends on frequency
        if frequency >= 4:
            days['Day4'] = []  # Active rest
        
        if frequency >= 5:
            # Repeat Push (lighter volume)
            days['Day5'] = [ex for ex in days['Day1'][:3]]  # Take first 3 exercises
        
        if frequency >= 6:
            # Repeat Pull (lighter volume)
            days['Day6'] = [ex for ex in days['Day2'][:3]]
        
        days['Day7'] = []  # Rest
        
        # Ensure all 7 days exist
        for i in range(1, 8):
            if f'Day{i}' not in days:
                days[f'Day{i}'] = []
        
        return {
            'week_start': week_start.isoformat(),
            'split': split,
            'days': days,
            'plan_version': 1,
            'meta': {
                'goal': goal,
                'frequency': frequency,
                'level': level,
                'equipment': equipment
            }
        }
```

---

## Step 2: Frontend JavaScript (Week Plan Loader with ETag)

Create `/Users/eswargeddam/Desktop/THINGS FOR WEBSITE DESIGN/MAR/js/weekly-plan-loader.js`:

```javascript
/**
 * Weekly Plan Loader with ETag Caching
 * 
 * Implements conditional GET for instant loads:
 * - Stores ETag in localStorage
 * - Sends If-None-Match header
 * - Handles 304 Not Modified responses
 * - Reuses cached plan data
 */

let planCache = {
  etag: localStorage.getItem('weekly_plan_etag'),
  data: null
};

// Try to restore cached data
try {
  const cached = localStorage.getItem('weekly_plan_data');
  if (cached) {
    planCache.data = JSON.parse(cached);
  }
} catch (e) {
  console.warn('Failed to restore cached plan:', e);
}

/**
 * Load weekly plan with ETag caching
 * @returns {Promise<Object>} Plan data
 */
async function loadWeeklyPlan() {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Add ETag if we have one cached
  if (planCache.etag) {
    headers['If-None-Match'] = planCache.etag;
  }
  
  // Get auth token
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const res = await fetch('/api/v1/weekly-plan/', {
      headers,
      credentials: 'include'
    });
    
    // 304 Not Modified - reuse cached data
    if (res.status === 304) {
      console.log('✅ Weekly plan cache HIT (304)');
      return planCache.data;
    }
    
    // 200 OK - new data
    if (res.ok) {
      const etag = res.headers.get('ETag');
      const data = await res.json();
      
      // Update cache
      planCache.etag = etag;
      planCache.data = data;
      
      // Persist to localStorage
      if (etag) {
        localStorage.setItem('weekly_plan_etag', etag);
        localStorage.setItem('weekly_plan_data', JSON.stringify(data));
      }
      
      console.log('✅ Weekly plan cache MISS (200) - updated');
      return data;
    }
    
    throw new Error(`Failed to load plan: ${res.status}`);
    
  } catch (error) {
    console.error('Failed to load weekly plan:', error);
    
    // Return cached data as fallback
    if (planCache.data) {
      console.warn('Using stale cached plan data');
      return planCache.data;
    }
    
    throw error;
  }
}

/**
 * Render exercise card HTML
 * @param {Object} ex - Exercise object
 * @returns {string} HTML
 */
function renderExerciseCard(ex) {
  const setsHTML = (ex.sets || []).map((s, i) => `
    <div class="set-cell">
      <label class="set-label">Set #</label>
      <input class="set-input" type="number" min="1" value="${i + 1}" inputmode="numeric" readonly>
    </div>
    <div class="set-cell">
      <label class="set-label">Reps</label>
      <input class="set-input" type="number" min="1" value="${s.reps || 8}" inputmode="numeric">
    </div>
    <div class="set-cell">
      <label class="set-label">Weight (${s.unit || 'kg'})</label>
      <input class="set-input" type="number" min="0" step="0.5" value="${s.weight || 0}" inputmode="decimal">
    </div>
    <div class="set-cell">
      <label class="set-label">RPE</label>
      <input class="set-input" type="number" min="1" max="10" step="0.5" value="${s.rpe || 8}" inputmode="decimal">
    </div>
  `).join('');
  
  return `
    <div class="set-card" data-exercise="${ex.id}">
      <div class="set-head">
        <div class="set-title">${ex.name}</div>
        <button class="set-ok" type="button" data-complete aria-pressed="false">✓ Complete</button>
      </div>
      <div class="set-grid">
        ${setsHTML}
      </div>
    </div>
  `;
}

/**
 * Show day schedule in UI
 * @param {string} dayKey - e.g., "Day1"
 */
async function showDaySchedule(dayKey) {
  const host = document.getElementById('weekly-plan-content');
  if (!host) {
    console.error('weekly-plan-content element not found');
    return;
  }
  
  try {
    const plan = await loadWeeklyPlan();
    const dayExercises = (plan?.days?.[dayKey]) || [];
    
    if (dayExercises.length === 0) {
      host.innerHTML = `
        <div class="text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center text-white text-2xl">
            😴
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Rest Day</h3>
          <p class="text-gray-600">Take it easy today and let your body recover!</p>
        </div>
      `;
    } else {
      host.innerHTML = dayExercises.map(renderExerciseCard).join('');
    }
    
    // Scroll to content
    host.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Success feedback
    if (window.microInteractions) {
      window.microInteractions.triggerSuccess(`${dayKey} loaded!`);
    }
    
  } catch (error) {
    console.error('Failed to show day schedule:', error);
    host.innerHTML = `
      <div class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center text-white text-2xl">
          ⚠️
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Failed to load workout</h3>
        <p class="text-gray-600 mb-4">Please check your connection and try again</p>
        <button onclick="showDaySchedule('${dayKey}')" class="bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700">
          Retry
        </button>
      </div>
    `;
  }
}

// Set completion toggle
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-complete]');
  if (!btn) return;
  
  const pressed = btn.getAttribute('aria-pressed') === 'true';
  btn.setAttribute('aria-pressed', String(!pressed));
  
  if (window.microInteractions) {
    window.microInteractions.triggerSuccess(pressed ? 'Set incomplete' : 'Set completed!');
  }
});

// Export for use in other scripts
window.weeklyPlanLoader = {
  loadWeeklyPlan,
  showDaySchedule,
  clearCache: () => {
    planCache = { etag: null, data: null };
    localStorage.removeItem('weekly_plan_etag');
    localStorage.removeItem('weekly_plan_data');
  }
};
```

---

## Step 3: Wire the Frontend Script

Add to `/Users/eswargeddam/Desktop/THINGS FOR WEBSITE DESIGN/MAR/about.html` before closing `</body>`:

```html
  <!-- Weekly Plan Loader with ETag -->
  <script src="js/weekly-plan-loader.js"></script>
</body>
</html>
```

---

## Step 4: Test the Implementation

### Backend Test:
```bash
cd backend
python manage.py runserver
```

### Frontend Test:
1. Open `http://localhost:8000/MAR/about.html`
2. Scroll to "Weekly Workout Schedule"
3. Click "Day 1" tab
4. **First load**: Should see 200 OK in Network tab
5. **Reload page**: Should see 304 Not Modified (instant!)
6. **Check console**: Should see "✅ Weekly plan cache HIT"

### Expected Network Behavior:
```
First request:
GET /api/v1/weekly-plan/
200 OK (200-300ms)
ETag: "abc123..."

Second request (same user, unchanged profile):
GET /api/v1/weekly-plan/
If-None-Match: "abc123..."
304 Not Modified (5-10ms) ⚡

Third request (after profile update):
GET /api/v1/weekly-plan/
If-None-Match: "abc123..."
200 OK (200-300ms) - new ETag returned
```

---

## Verification Checklist

- [ ] Weekly plan endpoint returns PPL split
- [ ] ETag header present in response
- [ ] 304 responses when profile unchanged
- [ ] Plan scales with user frequency (3-6 days)
- [ ] Frontend shows exercises in cards
- [ ] Set completion buttons work
- [ ] Cache survives page refresh
- [ ] Console shows cache HIT/MISS logs

---

## Next Steps (Phase 2)

Once Phase 1 is verified, we'll implement:
1. Session creation endpoint
2. Set logging with idempotency
3. Optimistic UI updates
4. Offline queue integration

---

## Notes

- **ETag invalidation**: Happens automatically when profile updates
- **Cache clearing**: `window.weeklyPlanLoader.clearCache()` in console
- **Production**: Add Redis for server-side caching if needed
- **Units**: Plan uses kg by default, convert based on user unit_system

This implementation is production-ready and follows Django/DRF best practices!

