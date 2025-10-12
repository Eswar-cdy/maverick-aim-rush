/**
 * Weekly Plan Loader with ETag Caching
 * Maverick Aim Rush - Phase 1 Implementation
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
    const res = await fetch('/api/v1/analytics/weekly-plan/', {
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
  // Calculate total sets
  const totalSets = (ex.sets || []).length;
  
  // Build set rows (each row contains: Set#, Reps, Weight, RPE)
  const setRows = (ex.sets || []).map((s, i) => `
    <div class="set-cell">
      <label class="set-label">Set ${i + 1}</label>
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
        <button class="set-ok" type="button" data-complete aria-pressed="false" title="Mark all sets complete">✓</button>
      </div>
      <div class="set-grid">
        ${setRows}
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
    console.log('✅ Weekly plan cache cleared');
  }
};

