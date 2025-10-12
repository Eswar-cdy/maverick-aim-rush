/**
 * Workout Session Manager
 * Handles session creation, tracking, and completion for Maverick Aim Rush
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
        },
        credentials: 'include'
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
        credentials: 'include',
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
      
      console.log('Session started:', data);
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
        },
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to end session');
      }
      
      const data = await res.json();
      
      // Stop timer
      this.stopTimer();
      
      // Show summary before clearing
      this.showWorkoutSummary(data);
      
      // Clear session
      this.currentSession = null;
      this.startTime = null;
      localStorage.removeItem('active_session');
      
      // Update UI
      this.updateUI();
      
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
    
    // Update immediately
    this.updateTimerDisplay();
    
    // Then update every second
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
    const duration = session.duration || 0;
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    let durationText = '';
    if (hours > 0) {
      durationText = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      durationText = `${minutes}m ${seconds}s`;
    } else {
      durationText = `${seconds}s`;
    }
    
    const summary = `
🎉 Workout Complete!

Duration: ${durationText}
Exercises: ${session.exercise_count || 0}
Total Volume: ${session.total_volume || 0} kg

Great work! 💪
    `;
    
    alert(summary);
    
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

console.log('✅ Session Manager initialized');

