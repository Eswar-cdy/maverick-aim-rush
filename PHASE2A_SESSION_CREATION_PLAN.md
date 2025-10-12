# Phase 2A: Workout Session Creation

**Status**: Ready to Implement  
**Estimated Time**: 30-45 minutes  
**Dependencies**: Phase 1 Complete ✅

---

## Overview

Implement workout session management to track when users start and end workouts. This allows us to:
- Record workout duration
- Track which exercises were performed
- Calculate total volume and calories
- Provide workout summaries

---

## Backend Implementation

### 1. Check Existing Models

The `WorkoutSession` model already exists in `backend/tracker/models.py`. We need to verify its structure and potentially enhance it.

**Expected fields**:
- `user` (ForeignKey to User)
- `start_time` (DateTimeField)
- `end_time` (DateTimeField, nullable)
- `duration` (IntegerField or calculated property)
- `notes` (TextField, optional)
- `calories_burned` (IntegerField, optional)

### 2. Create Session Serializer

**File**: `backend/tracker/serializers.py`

```python
class WorkoutSessionSerializer(serializers.ModelSerializer):
    duration = serializers.SerializerMethodField()
    exercise_count = serializers.SerializerMethodField()
    total_volume = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkoutSession
        fields = [
            'id', 'user', 'start_time', 'end_time', 'duration',
            'notes', 'calories_burned', 'exercise_count', 'total_volume'
        ]
        read_only_fields = ['id', 'user', 'start_time']
    
    def get_duration(self, obj):
        if obj.end_time:
            delta = obj.end_time - obj.start_time
            return int(delta.total_seconds())
        return None
    
    def get_exercise_count(self, obj):
        return obj.strength_sets.values('exercise').distinct().count()
    
    def get_total_volume(self, obj):
        from django.db.models import Sum, F
        return obj.strength_sets.aggregate(
            total=Sum(F('weight') * F('reps'))
        )['total'] or 0
```

### 3. Create Session ViewSet

**File**: `backend/tracker/views.py`

```python
class WorkoutSessionViewSet(viewsets.ModelViewSet):
    """
    Workout session management.
    
    POST /api/v1/sessions/        - Start new session
    GET /api/v1/sessions/          - List user's sessions
    GET /api/v1/sessions/{id}/     - Get session details
    PATCH /api/v1/sessions/{id}/   - Update session (end workout)
    DELETE /api/v1/sessions/{id}/  - Delete session
    """
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return WorkoutSession.objects.filter(
            user=self.request.user
        ).order_by('-start_time')
    
    def perform_create(self, serializer):
        # Auto-set user and start_time
        serializer.save(
            user=self.request.user,
            start_time=timezone.now()
        )
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get currently active session (end_time is null)"""
        session = WorkoutSession.objects.filter(
            user=request.user,
            end_time__isnull=True
        ).first()
        
        if session:
            serializer = self.get_serializer(session)
            return Response(serializer.data)
        
        return Response({'active': False}, status=200)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """End a workout session"""
        session = self.get_object()
        
        if session.end_time:
            return Response(
                {'error': 'Session already completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.end_time = timezone.now()
        
        # Optionally update calories from request
        if 'calories_burned' in request.data:
            session.calories_burned = request.data['calories_burned']
        
        session.save()
        
        serializer = self.get_serializer(session)
        return Response(serializer.data)
```

### 4. Add to URL Router

**File**: `backend/tracker/urls_v1.py`

```python
from .views import WorkoutSessionViewSet

router_v1.register(r'sessions', WorkoutSessionViewSet, basename='session')
```

---

## Frontend Implementation

### 1. Create Session Manager

**File**: `MAR/js/session-manager.js`

```javascript
/**
 * Workout Session Manager
 * Handles session creation, tracking, and completion
 */

class SessionManager {
  constructor() {
    this.currentSession = null;
    this.timer = null;
    this.startTime = null;
    this.restoreSession();
  }
  
  /**
   * Restore active session from localStorage or API
   */
  async restoreSession() {
    // Check localStorage first
    const stored = localStorage.getItem('active_session');
    if (stored) {
      try {
        this.currentSession = JSON.parse(stored);
        this.startTime = new Date(this.currentSession.start_time);
        this.startTimer();
        this.updateUI();
      } catch (e) {
        console.error('Failed to restore session:', e);
        localStorage.removeItem('active_session');
      }
    }
    
    // Verify with server
    await this.checkActiveSession();
  }
  
  /**
   * Check if there's an active session on the server
   */
  async checkActiveSession() {
    try {
      const token = getAccessToken();
      if (!token) return;
      
      const res = await fetch('/api/v1/sessions/active/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.active !== false) {
          // Active session exists on server
          this.currentSession = data;
          this.startTime = new Date(data.start_time);
          localStorage.setItem('active_session', JSON.stringify(data));
          this.startTimer();
          this.updateUI();
        }
      }
    } catch (error) {
      console.error('Failed to check active session:', error);
    }
  }
  
  /**
   * Start a new workout session
   */
  async startSession() {
    try {
      const token = getAccessToken();
      if (!token) {
        alert('Please log in to start a workout');
        return;
      }
      
      const res = await fetch('/api/v1/sessions/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (!res.ok) {
        throw new Error('Failed to start session');
      }
      
      const data = await res.json();
      this.currentSession = data;
      this.startTime = new Date(data.start_time);
      
      // Save to localStorage
      localStorage.setItem('active_session', JSON.stringify(data));
      
      // Start timer
      this.startTimer();
      this.updateUI();
      
      if (window.microInteractions) {
        window.microInteractions.triggerSuccess('Workout started!');
      }
      
      return data;
      
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start workout session');
    }
  }
  
  /**
   * End the current workout session
   */
  async endSession() {
    if (!this.currentSession) return;
    
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/v1/sessions/${this.currentSession.id}/complete/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to end session');
      }
      
      const data = await res.json();
      
      // Stop timer
      this.stopTimer();
      
      // Clear session
      this.currentSession = null;
      this.startTime = null;
      localStorage.removeItem('active_session');
      
      // Update UI
      this.updateUI();
      
      // Show summary
      this.showWorkoutSummary(data);
      
      return data;
      
    } catch (error) {
      console.error('Failed to end session:', error);
      alert('Failed to end workout session');
    }
  }
  
  /**
   * Start the workout timer
   */
  startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.timer = setInterval(() => {
      this.updateTimerDisplay();
    }, 1000);
  }
  
  /**
   * Stop the workout timer
   */
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  /**
   * Update timer display
   */
  updateTimerDisplay() {
    if (!this.startTime) return;
    
    const now = new Date();
    const elapsed = Math.floor((now - this.startTime) / 1000); // seconds
    
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    
    const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerEl = document.getElementById('workout-timer');
    if (timerEl) {
      timerEl.textContent = display;
    }
  }
  
  /**
   * Update UI based on session state
   */
  updateUI() {
    const startBtn = document.getElementById('start-workout-btn');
    const endBtn = document.getElementById('end-workout-btn');
    const timerEl = document.getElementById('workout-timer');
    
    if (this.currentSession) {
      // Active session
      if (startBtn) startBtn.classList.add('hidden');
      if (endBtn) endBtn.classList.remove('hidden');
      if (timerEl) timerEl.classList.remove('hidden');
      this.updateTimerDisplay();
    } else {
      // No active session
      if (startBtn) startBtn.classList.remove('hidden');
      if (endBtn) endBtn.classList.add('hidden');
      if (timerEl) timerEl.classList.add('hidden');
    }
  }
  
  /**
   * Show workout summary modal
   */
  showWorkoutSummary(session) {
    const duration = session.duration;
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    
    const summary = `
      <div class="workout-summary">
        <h3>🎉 Workout Complete!</h3>
        <div class="summary-stats">
          <div><strong>Duration:</strong> ${hours}h ${minutes}m</div>
          <div><strong>Exercises:</strong> ${session.exercise_count || 0}</div>
          <div><strong>Total Volume:</strong> ${session.total_volume || 0} kg</div>
          <div><strong>Calories:</strong> ${session.calories_burned || 0} kcal</div>
        </div>
      </div>
    `;
    
    // You can implement a modal here or use a toast notification
    if (window.microInteractions) {
      window.microInteractions.triggerSuccess('Workout completed!');
    }
    
    console.log('Workout summary:', session);
  }
  
  /**
   * Get current session
   */
  getCurrentSession() {
    return this.currentSession;
  }
  
  /**
   * Check if session is active
   */
  isActive() {
    return this.currentSession !== null;
  }
}

// Create global instance
window.sessionManager = new SessionManager();
```

### 2. Add UI Elements to HTML

**File**: `MAR/about.html`

Add buttons after the AI Recommendations Panel:

```html
<!-- Workout Session Controls -->
<div class="flex justify-center gap-4 mb-8">
  <button id="start-workout-btn" onclick="window.sessionManager.startSession()" class="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 hidden">
    🏋️ Start Workout
  </button>
  
  <div id="workout-timer" class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-2xl shadow-lg hidden">
    00:00:00
  </div>
  
  <button id="end-workout-btn" onclick="window.sessionManager.endSession()" class="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 hidden">
    ⏹️ End Workout
  </button>
</div>
```

Add script before closing `</body>`:

```html
<script src="js/session-manager.js"></script>
```

---

## Testing Checklist

### Backend Tests
- [ ] POST `/api/v1/sessions/` creates new session
- [ ] GET `/api/v1/sessions/active/` returns active session
- [ ] POST `/api/v1/sessions/{id}/complete/` ends session
- [ ] Session includes user, start_time, end_time
- [ ] Duration calculated correctly
- [ ] Only user's own sessions returned

### Frontend Tests
- [ ] "Start Workout" button appears when no active session
- [ ] Clicking "Start Workout" creates session
- [ ] Timer starts counting (00:00, 00:01, ...)
- [ ] Timer display updates every second
- [ ] "End Workout" button appears when session active
- [ ] Page reload restores active session
- [ ] Timer continues from correct time after reload
- [ ] Clicking "End Workout" stops timer
- [ ] Workout summary displayed
- [ ] Session cleared from localStorage

---

## Success Criteria

✅ Phase 2A is complete when:
1. User can start a workout session
2. Timer displays and counts up
3. Session persists across page reloads
4. User can end workout session
5. Workout summary shows duration, exercises, volume
6. No errors in console or server logs

---

**Estimated Implementation Time**: 30-45 minutes  
**Ready to Start**: Yes


