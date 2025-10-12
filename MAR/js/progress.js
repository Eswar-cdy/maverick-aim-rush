// Progress Analytics Renderer (list-based UI)

let cachedSummary = null;
let currentRange = 'all'; // '7' | '30' | '90' | 'all'
let cachedETags = new Map(); // Store ETags for caching
let currentChart = null; // Store chart instance for updates

// -- ETag-aware fetch (304 → reuse cached JSON) -----------------------------
async function fetchWithETag(url, opts = {}, cacheKey) {
  const headers = new Headers(opts.headers || {});
  const prev = localStorage.getItem(cacheKey + ':etag');
  if (prev) headers.set('If-None-Match', prev);
  const res = await apiFetch(url, { ...opts, headers });
  if (res.status === 304) {
    const cached = localStorage.getItem(cacheKey + ':data');
    return cached ? JSON.parse(cached) : null;
  }
  const data = await res.json();
  const tag = res.headers.get('ETag');
  if (tag) {
    localStorage.setItem(cacheKey + ':etag', tag);
    localStorage.setItem(cacheKey + ':data', JSON.stringify(data));
  }
  return data;
}

// -- Chart.js common perf options ------------------------------------------
const MAR_CHART_OPTS = {
  animation: false,
  spanGaps: true,
  parsing: false,
  interaction: { mode: 'index', intersect: false },
  elements: { line: { tension: 0.35 } },
  plugins: { decimation: { enabled: true, algorithm: 'lttb' } },
};

async function fetchProgressSummary() {
  try {
    const url = 'http://127.0.0.1:8000/api/progress/summary/';
    const headers = {};
    
    // Add ETag for caching
    const cachedETag = cachedETags.get(url);
    if (cachedETag) {
      headers['If-None-Match'] = cachedETag;
    }
    
    const resp = await apiFetch(url, { headers });
    
    // Handle 304 Not Modified
    if (resp.status === 304) {
      console.log('Using cached progress summary');
      return cachedSummary || { volume_trend: [], prs: [], sessions_per_week: [], recent_sessions: [], kpis: {} };
    }
    
    if (!resp.ok) throw new Error('Failed to fetch progress summary');
    
    // Store ETag for future requests
    const etag = resp.headers.get('ETag');
    if (etag) {
      cachedETags.set(url, etag);
    }
    
    const data = await resp.json();
    cachedSummary = data; // Cache the data
    return data;
  } catch (e) {
    console.error('Progress summary error', e);
    return { volume_trend: [], prs: [], sessions_per_week: [], recent_sessions: [], kpis: {} };
  }
}

async function fetchExerciseTrend(exerciseId) {
  try {
    const url = `http://127.0.0.1:8000/api/progress/exercise-trend/?exercise_id=${encodeURIComponent(exerciseId)}`;
    const headers = {};
    
    // Add ETag for caching
    const cachedETag = cachedETags.get(url);
    if (cachedETag) {
      headers['If-None-Match'] = cachedETag;
    }
    
    const resp = await apiFetch(url, { headers });
    
    // Handle 304 Not Modified
    if (resp.status === 304) {
      console.log('Using cached exercise trend');
      return { trend: [] };
    }
    
    if (!resp.ok) throw new Error('Failed to fetch exercise trend');
    
    // Store ETag for future requests
    const etag = resp.headers.get('ETag');
    if (etag) {
      cachedETags.set(url, etag);
    }
    
    return await resp.json();
  } catch (e) {
    console.error('Exercise trend error', e);
    return { trend: [] };
  }
}

async function fetchMeasurements() {
  try {
    const resp = await apiFetch('http://127.0.0.1:8000/api/measurements/');
    if (!resp.ok) throw new Error('Failed to fetch measurements');
    const data = await resp.json();
    return Array.isArray(data) ? data : (data.results || []);
  } catch (e) {
    console.error('Measurements error', e);
    return [];
  }
}

async function createMeasurement(payload) {
  const resp = await apiFetch('http://127.0.0.1:8000/api/measurements/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) throw new Error('Failed to save measurement');
  
  // Clear cached data to force refresh
  cachedETags.delete('http://127.0.0.1:8000/api/progress/summary/');
  cachedSummary = null;
  
  return resp.json();
}

async function fetchGoals() {
  try {
    const resp = await apiFetch('http://127.0.0.1:8000/api/goals/');
    if (!resp.ok) throw new Error('Failed to fetch goals');
    return await resp.json();
  } catch (e) {
    console.error('Goals error', e);
    return [];
  }
}

async function createGoal(payload) {
  const resp = await apiFetch('http://127.0.0.1:8000/api/goals/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) throw new Error('Failed to save goal');
  return resp.json();
}

async function deleteGoal(goalId) {
  const resp = await apiFetch(`http://127.0.0.1:8000/api/goals/${goalId}/`, {
    method: 'DELETE',
  });
  if (!resp.ok) throw new Error('Failed to delete goal');
}

async function fetchAllExercises() {
  try {
    const resp = await apiFetch('http://127.0.0.1:8000/api/exercises/?page_size=300');
    if (!resp.ok) throw new Error('Failed to fetch exercises');
    const data = await resp.json();
    return data.results || data || [];
  } catch (e) {
    console.error('Exercises fetch error', e);
    return [];
  }
}

async function wireExerciseAutocomplete() {
  const input = document.getElementById('g-ex-name');
  const hidden = document.getElementById('g-ex');
  const list = document.getElementById('ex-options');
  if (!input || !hidden || !list) return;
  const exs = await fetchAllExercises();
  list.innerHTML = exs.map(ex => `<option data-id="${ex.id}" value="${ex.name}"></option>`).join('');
  input.onchange = () => {
    const opt = Array.from(list.options).find(o => o.value.toLowerCase() === input.value.toLowerCase());
    hidden.value = opt ? opt.getAttribute('data-id') : '';
  };
}

function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

function renderList(containerId, itemsHtml) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = itemsHtml || '<p>No data yet.</p>';
}

function bar(value, max, label, color='#3b82f6') {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return `<div style="display:flex;align-items:center;gap:.5rem;">
    <div style="background:#e5e7eb;border-radius:9999px;width:100%;height:10px;overflow:hidden;">
      <div style="background:${color};width:${width}%;height:10px;"></div>
    </div>
    <div style="min-width:120px;text-align:right;font-weight:600;">${label}</div>
  </div>`;
}

function sum(arr) { return arr.reduce((a,b)=>a+(Number(b)||0),0); }

// --- Phase 1: Fitness analytics utilities (BMR, HR zones, e1RM, TRIMP) ---
// Mifflin–St Jeor BMR (kcal/day)
function computeBMRMifflinStJeor(params){
  try{
    const sex=(params.sex||params.gender||'male').toLowerCase();
    const weightKg=Number(params.weight_kg||params.weight)||0; // kg
    const heightCm=Number(params.height_cm||params.height)||0; // cm
    const age=Number(params.age)||0; // years
    if(!weightKg||!heightCm||!age) return null;
    const base = (10*weightKg) + (6.25*heightCm) - (5*age);
    return Math.round(base + (sex==='male'?5:-161));
  }catch(_){ return null; }
}

// Heart Rate Reserve (HRR) zones using Karvonen method
function computeHRRZones(restingBpm, maxBpm){
  const r=Math.max(30, Number(restingBpm||0));
  const m=Math.max(r+1, Number(maxBpm||0));
  const reserve = m - r;
  const pct=[0.5,0.6,0.7,0.8,0.9,1.0];
  const zones=pct.map(p=> Math.round(r + reserve*p));
  return {
    zones, // boundaries for 50,60,70,80,90,100%
    zoneFor(bpm){
      const b=Number(bpm||0);
      if(!b) return 0;
      for(let i=0;i<zones.length;i++){ if(b<zones[i]) return i; }
      return zones.length;
    }
  };
}

// e1RM calculators
function epleyE1RM(weightKg, reps){ if(!weightKg||!reps) return null; return weightKg * (1 + reps/30); }
function brzyckiE1RM(weightKg, reps){ if(!weightKg||!reps||reps>=37) return null; return weightKg * (36/(37-reps)); }
function bestE1RM(weightKg, reps){
  const values=[epleyE1RM(weightKg,reps), brzyckiE1RM(weightKg,reps)].filter(v=>Number.isFinite(v));
  if(!values.length) return null;
  // Average to smooth estimator variance
  return Math.round((values.reduce((a,b)=>a+b,0)/values.length)*10)/10;
}

// TRIMP (Banister)
function trimpBanister(durationMin, avgBpm, restingBpm, maxBpm, sex='male'){
  const d = Number(durationMin||0);
  const r = Number(restingBpm||0);
  const m = Number(maxBpm||0);
  const hr = Number(avgBpm||0);
  if(!d||!r||!m||!hr||m<=r) return 0;
  const hrr = (hr - r) / (m - r);
  const k = (String(sex).toLowerCase()==='female') ? 1.67 : 1.92;
  return Math.round(d * hrr * Math.exp(k*hrr));
}

async function computeFallbackPRsFromSets(){
  try{
    const resp = await apiFetch('http://127.0.0.1:8000/api/strength-sets/?page_size=500&ordering=-id');
    if(!resp.ok) return [];
    const data = await resp.json();
    const sets = Array.isArray(data.results)? data.results : (Array.isArray(data)? data : []);
    // Aggregate best e1RM per exercise
    const bestByExercise = new Map();
    sets.forEach(s => {
      const w = Number(s.weight_kg||0);
      const r = Number(s.reps||s.repetitions||0);
      const exName = s.exercise_name || s.exercise?.name || s.exercise || 'Exercise';
      const e1 = bestE1RM(w,r);
      if(!e1) return;
      const cur = bestByExercise.get(exName);
      if(!cur || e1>cur.max_weight){ bestByExercise.set(exName, { exercise: exName, max_weight: Math.round(e1*10)/10, exercise_id: s.exercise||s.exercise_id||null }); }
    });
    return Array.from(bestByExercise.values());
  }catch(_){ return []; }
}

function filterByRange(items, getDateStr) {
  if (currentRange === 'all') return items;
  const days = Number(currentRange);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return items.filter(x => {
    const d = new Date(getDateStr(x));
    return d >= cutoff;
  });
}

function download(name, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function exportCsv(summary) {
  const sessions = summary.recent_sessions || [];
  const vol = summary.volume_trend || [];
  const rows = ['type,date,sets,volume'];
  sessions.forEach(s => rows.push(`session,${s.date},${s.sets},${s.volume}`));
  vol.forEach(v => rows.push(`volume,${v.date},,${v.volume}`));
  download('progress.csv', rows.join('\n'));
}

function renderMeasurements(list) {
  const rows = list.slice(0,10).map(m => {
    const bmi = m.bmi != null ? `BMI: ${m.bmi}` : '';
    const bf = m.body_fat_percentage != null ? `${m.body_fat_percentage}%` : '—';
    const w = m.weight_kg != null ? `${m.weight_kg} kg` : '—';
    return `<div class="list-row" style="padding:.5rem 0;border-bottom:1px solid #eee;display:flex;justify-content:space-between;gap:1rem;align-items:center;">
      <div><strong>${m.date}</strong> · Weight: ${w} · Body Fat: ${bf} ${bmi ? ' · '+bmi : ''}</div>
      ${m.photo_url ? `<a href="${m.photo_url}" target="_blank" style="color:#3b82f6;">Photo</a>` : ''}
    </div>`;
  }).join('');
  renderList('list-measurements', rows);
}

function computeMeasurementTrends(list) {
  const sorted = list.slice().sort((a,b)=> (a.date < b.date ? -1 : 1));
  return {
    weight: sorted.filter(m => m.weight_kg != null).map(m => ({ date: m.date, value: m.weight_kg })),
    bodyfat: sorted.filter(m => m.body_fat_percentage != null).map(m => ({ date: m.date, value: m.body_fat_percentage })),
    bmi: sorted.filter(m => m.bmi != null).map(m => ({ date: m.date, value: m.bmi })),
  };
}

function renderMeasurementTrends(trends) {
  const container = document.getElementById('list-volume');
  if (!container) return;
  const maxW = Math.max(...trends.weight.map(x=>x.value||0), 0);
  const maxBF = Math.max(...trends.bodyfat.map(x=>x.value||0), 0);
  const maxBMI = Math.max(...trends.bmi.map(x=>x.value||0), 0);
  const make = (rows, color) => rows.map(v => `
    <div class="list-row" style="padding:.25rem 0;border-bottom:1px dashed #eee;display:flex;gap:1rem;align-items:center;">
      <div style="min-width:96px;">${v.date}</div>
      <div style="flex:1;">${bar(v.value||0, (color==='#f59e0b'?maxBF:color==='#ef4444'?maxBMI:maxW), String(v.value), color)}</div>
    </div>
  `).join('');
  const html = `
    <h4 style="margin-top:1rem;">Weight Trend</h4>
    ${make(trends.weight, '#3b82f6')}
    <h4 style="margin-top:1rem;">Body Fat Trend</h4>
    ${make(trends.bodyfat, '#f59e0b')}
    <h4 style="margin-top:1rem;">BMI Trend</h4>
    ${make(trends.bmi, '#ef4444')}
  `;
  // Append after current content
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  container.parentElement.appendChild(wrap);
}

function renderGoals(goals) {
  const rows = goals.map(g => {
    const metricLabel = g.metric === 'weight_kg' ? 'kg' : (g.metric === 'body_fat' ? '%' : 'kg');
    const cur = g.current_value != null ? `${g.current_value} ${metricLabel}` : '—';
    const pct = g.percent != null ? `${g.percent}%` : '—';
    const ex = g.exercise_name ? ` · ${g.exercise_name}` : (g.exercise ? ` · Ex #${g.exercise}`: '');
    // Alerts
    let badge = '';
    const percentNum = Number(g.percent || 0);
    if (percentNum >= 100) badge = '<span style="background:#10b981;color:#fff;padding:.2rem .5rem;border-radius:9999px;font-size:.8rem;">Done</span>';
    else if (percentNum >= 90) badge = '<span style="background:#f59e0b;color:#fff;padding:.2rem .5rem;border-radius:9999px;font-size:.8rem;">Near</span>';
    const eta = g.eta ? `<span style="font-size:.9rem;color:#6b7280;">ETA: ${g.eta}</span>` : '';
    return `<div class="list-row" style="padding:.5rem 0;border-bottom:1px solid #eee;display:flex;justify-content:space-between;gap:1rem;align-items:center;">
      <div><strong>${g.goal_type}</strong> · ${g.metric}${ex} · Target: ${g.target_value} ${metricLabel} · Current: ${cur} ${eta}</div>
      <div style="display:flex;gap:.5rem;align-items:center;"><div style="min-width:100px;text-align:right;">${pct}</div>${badge}
        <button class="delete-goal" data-id="${g.id}" style="background:#ef4444;color:#fff;border:0;border-radius:9999px;width:24px;height:24px;cursor:pointer;">×</button>
      </div>
    </div>`;
  }).join('');
  renderList('list-goals', rows);
  // Wire delete buttons
  document.querySelectorAll('.delete-goal').forEach(btn => {
    btn.onclick = async () => {
      if (confirm('Are you sure?')) {
        await deleteGoal(btn.getAttribute('data-id'));
        const list = await fetchGoals();
        renderGoals(list);
      }
    };
  });
}

function wireGoalForm() {
  const btn = document.getElementById('g-save');
  if (!btn) return;
  btn.onclick = async () => {
    try {
      const payload = {
        goal_type: document.getElementById('g-type').value,
        metric: document.getElementById('g-metric').value,
        target_value: parseFloat(document.getElementById('g-target').value || 0),
        exercise: document.getElementById('g-ex').value || null,
        notes: document.getElementById('g-notes').value || '',
        start_date: document.getElementById('g-start').value,
        end_date: document.getElementById('g-end').value || null,
        is_active: true,
      };
      if (!payload.start_date) { alert('Please set a start date'); return; }
      await createGoal(payload);
      const list = await fetchGoals();
      renderGoals(list);
    } catch (e) {
      alert('Failed to save goal.');
    }
  };
}

async function initGoals() {
  await wireExerciseAutocomplete();
  const goals = await fetchGoals();
  renderGoals(goals);
  wireGoalForm();
}

function wireMeasurementForm() {
  const btn = document.getElementById('m-save');
  if (!btn) return;
  btn.onclick = async () => {
    try {
      const toNull = v => (isNaN(parseFloat(v)) ? null : parseFloat(v));
      const payload = {
        date: document.getElementById('m-date').value,
        weight_kg: toNull(document.getElementById('m-weight').value),
        body_fat_percentage: toNull(document.getElementById('m-bf').value),
        height_cm: toNull(document.getElementById('m-height').value),
        neck_cm: toNull(document.getElementById('m-neck').value),
        chest_cm: toNull(document.getElementById('m-chest').value),
        shoulder_cm: toNull(document.getElementById('m-shoulder').value),
        l_bicep_cm: toNull(document.getElementById('m-lb').value),
        r_bicep_cm: toNull(document.getElementById('m-rb').value),
        l_forearm_cm: toNull(document.getElementById('m-lf').value),
        r_forearm_cm: toNull(document.getElementById('m-rf').value),
        waist_cm: toNull(document.getElementById('m-waist').value),
        hips_cm: toNull(document.getElementById('m-hips').value),
        l_thigh_cm: toNull(document.getElementById('m-lt').value),
        r_thigh_cm: toNull(document.getElementById('m-rt').value),
        l_calf_cm: toNull(document.getElementById('m-lc').value),
        r_calf_cm: toNull(document.getElementById('m-rc').value),
        skinfold_sum_mm: toNull(document.getElementById('m-skin').value),
        photo_url: document.getElementById('m-photo').value || null,
      };
      if (!payload.date) { alert('Please select a date'); return; }
      
      // Optimistic update - show success immediately
      const oldText = btn.textContent; 
      btn.textContent = 'Saving...'; 
      btn.disabled = true;
      
      try {
        await createMeasurement(payload);
        btn.textContent = 'Saved ✓'; 
        showToast('Measurement saved successfully!', 'success');
        
        // Optimistic update
        optimisticAddMeasurement(payload);
        
        // Refresh data in background
        const list = await fetchMeasurements();
        renderMeasurements(list);
        
        setTimeout(()=>{ 
          btn.textContent = oldText; 
          btn.disabled = false; 
        }, 1500);
      } catch (e) {
        btn.textContent = 'Failed'; 
        showToast('Failed to save measurement. Retrying...', 'error');
        
        setTimeout(()=>{ 
          btn.textContent = oldText; 
          btn.disabled = false; 
        }, 2000);
      }
    } catch (e) {
      const oldText = btn.textContent; 
      btn.textContent = 'Failed'; 
      showToast('Failed to save measurement. Please try again.', 'error');
      setTimeout(()=>{ 
        btn.textContent = oldText; 
        btn.disabled = false; 
      }, 1200);
    }
  };
}

async function initMeasurements() {
  const list = await fetchMeasurements();
  window.__measurements = list;
  renderMeasurements(list);
  // Render measurement trends
  const trends = computeMeasurementTrends(list);
  renderMeasurementTrends(trends);
  wireMeasurementForm();
  wireUnitToggles();
  updateUnitLabels();
  // wireLiveInsights(); // TODO: Implement this function
  // wireAnatomyGuide(); // TODO: Implement this function
  // recomputeLiveInsights(); // TODO: Implement this function
}

async function renderExerciseDrilldown(exerciseId, exerciseName) {
  const container = document.getElementById('list-prs');
  const trendWrapId = 'drilldown-wrap';
  let wrap = document.getElementById(trendWrapId);
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = trendWrapId;
    container.parentElement.appendChild(wrap);
  }
  wrap.innerHTML = `<h4 style="margin-top:1rem;">${exerciseName} — Trend</h4><div id="list-ex-trend" class="list-card"></div>`;
  const data = await fetchExerciseTrend(exerciseId);
  const trend = filterByRange((data.trend || []), d => d.date);
  const maxW = Math.max(...trend.map(t => t.max_weight||0),0);
  renderList('list-ex-trend', trend.map(t => `
    <div class="list-row" style="padding:.5rem 0;border-bottom:1px solid #eee;display:flex;gap:1rem;align-items:center;">
      <div>${t.date}</div>
      <div style="flex:1;">${bar(t.max_weight||0, maxW, (t.max_weight||0)+' kg')}</div>
    </div>
  `).join(''));
}

function renderAll(summary) {
  // KPIs
  setText('kpi-sessions-week', summary.kpis?.sessions_this_week != null ? String(summary.kpis.sessions_this_week) : '0');
  const vol7 = summary.kpis?.total_volume_7d || 0;
  setText('kpi-volume-7d', vol7 ? vol7.toLocaleString() + ' kg×reps' : 'No data');
  setText('insight-trend', vol7 > 0 ? `You've lifted ${vol7.toLocaleString()} kg×reps over the last 7 days.` : 'Keep logging workouts to see trends here.');
  setText('insight-best', summary.kpis?.longest_streak ? `Longest streak: ${summary.kpis.longest_streak} days. Current streak: ${summary.kpis.current_streak || 0} days.` : 'Your best lift will appear here after a few sessions.');

  // Recent sessions list
  const sessionsSorted = (summary.recent_sessions || []).slice().sort((a,b)=> (a.date < b.date ? 1 : -1));
  const sessions = filterByRange(sessionsSorted, s => s.date);
  const maxSessVol = Math.max(...sessions.map(s => s.volume || 0), 0);
  renderList('list-sessions', sessions.map(s => `
    <div class="list-row" style="padding:.5rem 0;border-bottom:1px solid #eee;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;">
        <div><strong>${s.date}</strong> · ${s.sets} sets</div>
        <div style="flex:1;">${bar(s.volume||0, maxSessVol, (s.volume||0).toLocaleString())}</div>
      </div>
    </div>
  `).join(''));

  // PRs list with click handlers for drilldown
  const prs = summary.prs || [];
  let prsList = prs;
  // Fallback: if API did not return PRs, compute from sets via e1RM
  (async ()=>{
    try{
      if(!prsList.length){ prsList = await computeFallbackPRsFromSets(); }
      const maxPr = Math.max(...prsList.map(p=>p.max_weight||0), 0);
      renderList('list-prs', prsList.map(p => `
    <div class="list-row pr-row" data-ex-id="${p.exercise_id}" data-ex-name="${p.exercise}" style="cursor:pointer;padding:.5rem 0;border-bottom:1px solid #eee;display:flex;justify-content:space-between;gap:1rem;align-items:center;">
      <div>${p.exercise}</div>
      <div style="flex:1;">${bar(p.max_weight||0, maxPr, (p.max_weight||0)+' kg')}</div>
    </div>
  `).join(''));
      document.querySelectorAll('.pr-row').forEach(el => {
        el.onclick = () => renderExerciseDrilldown(el.getAttribute('data-ex-id'), el.getAttribute('data-ex-name'));
      });
    }catch(_){ /* silent */ }
  })();

  // Volume trend with nutrition overlay (calories as green bar, protein as orange)
  const volSorted = (summary.volume_trend || []).slice().sort((a,b)=> (a.date < b.date ? -1 : 1));
  const nutSorted = (summary.nutrition_by_date || []).slice().sort((a,b)=> (a.date < b.date ? -1 : 1));
  const volByDate = new Map(volSorted.map(v => [v.date, v.volume]));
  const nutByDate = new Map(nutSorted.map(n => [n.date, n]));
  const merged = volSorted.map(v => ({
    date: v.date,
    volume: v.volume,
    calories: nutByDate.get(v.date)?.calories || 0,
    protein: nutByDate.get(v.date)?.protein || 0,
  }));
  const filtered = filterByRange(merged, m => m.date);
  const maxVol = Math.max(...filtered.map(v=>v.volume||0), 0);
  const maxCal = Math.max(...filtered.map(v=>v.calories||0), 0);
  renderList('list-volume', filtered.map(v => `
    <div class="list-row" style="padding:.5rem 0;border-bottom:1px solid #eee;display:flex;flex-direction:column;gap:.25rem;">
      <div style="font-weight:600;">${v.date}</div>
      <div>${bar(v.volume||0, maxVol, (v.volume||0).toLocaleString(), '#3b82f6')}</div>
      <div>${bar(v.calories||0, maxCal, (v.calories||0)+' kcal', '#10b981')}</div>
      <div style="font-size:.9rem;color:#6b7280;">Protein: ${(v.protein||0)} g</div>
    </div>
  `).join(''));
}

async function initProgressLists() {
  if (!getAccessToken()) return;
  cachedSummary = await fetchProgressSummary();
  renderAll(cachedSummary);

  // Wire filters
  const hook = (id, range) => {
    const el = document.getElementById(id); if (!el) return;
    el.onclick = () => { currentRange = range; renderAll(cachedSummary); };
  };
  hook('range-7','7'); hook('range-30','30'); hook('range-90','90'); hook('range-all','all');

  // Export CSV
  const exportBtn = document.getElementById('export-csv');
  if (exportBtn) exportBtn.onclick = () => exportCsv(cachedSummary);
}

// New Tabbed UI and Charting Logic for Redesigned Progress Page

function initNewProgressPage() {
  console.log('Initializing new progress page...');
  
  // Setup tab events first
  setupTabEvents();
  
  // Load unit state
  loadUnitState();
  
  // Wire anatomy guide
  // wireAnatomyGuide(); // TODO: Implement this function
  
  // Wire photo upload
  wirePhotoUpload();
  
  // Batch load initial data for better performance
  batchLoadInitialData();
  
  // Load photos separately (can be slower)
  loadPhotosData();
  
  console.log('New progress page initialized');
}

// --- Batch data loading for performance ---
async function batchLoadInitialData() {
  const loadingPromises = [
    fetchWithETag('/progress/summary/', {}, 'progress:summary'),
    fetchMeasurements(),
    fetchGoals()
  ];
  
  try {
    const [summary, measurements, goals] = await Promise.all(loadingPromises);
    
    // Render all data at once
    if (summary) renderOverviewChart(measurements);
    renderMeasurements(measurements);
    renderGoals(goals);
    
    console.log('Initial data loaded successfully');
  } catch (error) {
    console.error('Error loading initial data:', error);
    showToast('Some data failed to load. Please refresh the page.', 'error');
  }
}

// -- Optimistic add for measurements ----------------------------------------
function optimisticAddMeasurement(entry) {
  try {
    // KPI tile (if present)
    const el = document.getElementById('kpi-current-weight');
    if (el && entry.weight_kg != null) el.textContent = Number(entry.weight_kg).toFixed(1);

    // Chart push (if you store the chart instance globally)
    if (window.__overviewChart && entry.date && entry.weight_kg != null) {
      const ds = window.__overviewChart.data?.datasets?.[0]; // weight series
      if (ds && Array.isArray(ds.data)) {
        ds.data.push({ x: entry.date, y: entry.weight_kg });
        window.__overviewChart.update('none');
      }
    }

    // Table/list refresh hook (if you have one)
    if (typeof appendMeasurementRow === 'function') appendMeasurementRow(entry);
  } catch (e) {
    console.warn('Optimistic update failed:', e);
  }
}

// Tabs "activated" event (lazy init per tab; optional but recommended)
document.addEventListener('progress:tab-activated', (ev) => {
  const name = ev.detail?.name;
  if (name === 'performance' && !window.__perfInitDone) {
    window.__perfInitDone = true;
    if (typeof wireExerciseAutocomplete === 'function') wireExerciseAutocomplete();
  }
  if (name === 'photos' && !window.__photosInitDone) {
    window.__photosInitDone = true;
    // Lightly hydrate gallery if you lazy-load photos
    if (typeof loadPhotosIfNeeded === 'function') loadPhotosIfNeeded();
  }
  if (name === 'body-stats' && !window.__bmWired) {
    window.__bmWired = true;
    if (typeof wireBodyMap === 'function') wireBodyMap();
    if (typeof wireBodyMapLabels === 'function') wireBodyMapLabels();
  }
});

// -- Before/After Photo Helper ----------------------------------------------
function createBeforeAfterComparison(beforeUrl, afterUrl, beforeDate, afterDate) {
  return `
    <div class="ba-wrap">
      <div class="ba-viewport">
        <img src="${beforeUrl}" alt="Before photo from ${beforeDate}" class="ba-img">
        <img src="${afterUrl}" alt="After photo from ${afterDate}" class="ba-img ba-overlay">
        <div class="ba-slider"></div>
      </div>
      <div class="ba-caption">
        <span>Before: ${beforeDate}</span>
        <span>After: ${afterDate}</span>
      </div>
    </div>
  `;
}

// Helper to render photo comparisons in the gallery
function renderPhotoComparisons(photos) {
  const container = document.getElementById('photo-timeline-gallery');
  if (!container) return;

  // Group photos by month for comparison
  const grouped = photos.reduce((acc, photo) => {
    const month = new Date(photo.date).toISOString().slice(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(photo);
    return acc;
  }, {});

  let html = '';
  
  // Create before/after comparisons for each month with multiple photos
  Object.entries(grouped).forEach(([month, monthPhotos]) => {
    if (monthPhotos.length >= 2) {
      const sorted = monthPhotos.sort((a, b) => new Date(a.date) - new Date(b.date));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      
      html += `
        <div class="gallery-item">
          ${createBeforeAfterComparison(
            first.photo_url || '/assets/placeholder-before.jpg',
            last.photo_url || '/assets/placeholder-after.jpg',
            first.date,
            last.date
          )}
        </div>
      `;
    }
    
    // Add individual photos
    monthPhotos.forEach(photo => {
      html += `
        <div class="gallery-item">
          <img src="${photo.photo_url || '/assets/placeholder.jpg'}" alt="Progress photo from ${photo.date}" class="gallery__img">
          <div class="date-badge">${new Date(photo.date).toLocaleDateString()}</div>
        </div>
      `;
    });
  });

  container.innerHTML = html;
}

// -- Enhanced Toast Helper ------------------------------------------------
function showToast(message, type = 'info', duration = 3000) {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(toast => toast.remove());
  
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <div class="toast__content">
      <span class="toast__message">${message}</span>
      <button class="toast__close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  // Add to page
  document.body.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('toast--show');
  });
  
  // Auto remove
  if (duration > 0) {
    setTimeout(() => {
      toast.classList.remove('toast--show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  return toast;
}

// Interactive Body Map ↔ Form focus
function wireBodyMap() {
  const root = document.getElementById('body-map');
  if (!root) return;
  const regions = Array.from(root.querySelectorAll('.bm-region'));

  const fieldMap = {
    neck: 'm-neck',
    shoulder: 'm-shoulder',
    chest: 'm-chest',
    waist: 'm-waist',
    hips: 'm-hips',
    l_bicep: 'm-lb',
    r_bicep: 'm-rb',
    l_forearm: 'm-lf',
    r_forearm: 'm-rf',
    l_thigh: 'm-lt',
    r_thigh: 'm-rt',
    l_calf: 'm-lc',
    r_calf: 'm-rc',
  };

  const valueBadges = root.querySelectorAll('[data-badge]');

  function setActive(id) {
    regions.forEach(r => r.classList.toggle('is-active', r.id === id || r.dataset.region === id));
  }

  function focusField(id) {
    const fieldId = fieldMap[id];
    if (!fieldId) return;
    const input = document.getElementById(fieldId) || document.querySelector(`[name="${fieldId}"]`);
    if (input) {
      input.focus();
      input.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    setActive(id);
  }

  regions.forEach(r => {
    const regionId = r.dataset.region || r.id;
    if (!regionId) return;
    r.setAttribute('tabindex', '0');
    r.addEventListener('click', () => focusField(regionId));
    r.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        focusField(regionId);
      }
    });
    r.addEventListener('mouseenter', () => setActive(regionId));
    r.addEventListener('mouseleave', () => setActive(null));
  });

  Object.entries(fieldMap).forEach(([regionId, fieldId]) => {
    const input = document.getElementById(fieldId) || document.querySelector(`[name="${fieldId}"]`);
    if (!input) return;
    input.addEventListener('focus', () => setActive(regionId));
    input.addEventListener('blur', () => setActive(null));
    input.addEventListener('input', (e) => {
      const badge = root.querySelector(`[data-badge="${regionId}"]`);
      if (badge) {
        badge.textContent = e.target.value ? `${Number(e.target.value).toFixed(1)} ${unitState.length}` : '— cm';
      }
    });
  });

  valueBadges.forEach(badge => {
    const regionId = badge.dataset.badge;
    if (!regionId) return;
    const inputId = fieldMap[regionId];
    const input = inputId && (document.getElementById(inputId) || document.querySelector(`[name="${inputId}"]`));
    if (input && input.value) {
      badge.textContent = `${Number(input.value).toFixed(1)} ${unitState.length}`;
    }
  });
}

function wireBodyMapLabels() {
  document.querySelectorAll('[data-badge]').forEach(lbl => {
    const region = lbl.dataset.badge;
    if (!region) return;
    lbl.setAttribute('role', 'button');
    lbl.setAttribute('tabindex', '0');
    lbl.addEventListener('click', () => focusRegion(region));
    lbl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        focusRegion(region);
      }
    });
  });

  function focusRegion(region) {
    const target = document.querySelector(`.bm-region[data-region="${region}"]`) || document.getElementById(region);
    if (target) target.click();
  }
}
document.addEventListener('DOMContentLoaded', () => {
  // Ensure we are on the new progress page before running new logic
  if (document.querySelector('.progress-tabs')) {
    initNewProgressPage();
    // If user lands directly on Body Stats tab, wire the body map immediately
    const qsTab = new URLSearchParams(location.search).get('tab');
    if (qsTab === 'body-stats' && !window.__bmWired) { window.__bmWired = true; wireBodyMap(); wireBodyMapLabels(); }
  } else if (document.getElementById('list-sessions')) {
    // Fallback for the old page structure if it still exists
    initProgressLists();
    initMeasurements();
    initGoals();
  }
});

// --- Units and Live Insights wiring ---
let unitState = { weight: 'kg', length: 'cm' };

function kgToLb(v){ return v==null?null: (v*2.2046226218); }
function lbToKg(v){ return v==null?null: (v/2.2046226218); }
function cmToIn(v){ return v==null?null: (v/2.54); }
function inToCm(v){ return v==null?null: (v*2.54); }

function updateUnitLabels(){
  document.querySelectorAll('.label-weight-unit').forEach(el=> el.textContent = unitState.weight);
  document.querySelectorAll('.label-length-unit').forEach(el=> el.textContent = unitState.length);
}

// Backwards-compat: some code still calls loadUnitState(); delegate to loadUnits()
function loadUnitState(){ try{ loadUnits(); }catch(_){} }

// --- Persistence helpers ---
const LS_TAB_KEY = 'progress_last_tab';
const LS_UNITS_KEY = 'progress_units_v1';
function saveUnits(){ try{ localStorage.setItem(LS_UNITS_KEY, JSON.stringify(unitState)); }catch(_){} }
function loadUnits(){ try{ const s=localStorage.getItem(LS_UNITS_KEY); if(s){ const u=JSON.parse(s); if(u.weight) unitState.weight=u.weight; if(u.length) unitState.length=u.length; } }catch(_){} }

// --- Toasts ---
function ensureToastRoot(){ let r=document.getElementById('toast-root'); if(!r){ r=document.createElement('div'); r.id='toast-root'; r.style.position='fixed'; r.style.right='16px'; r.style.bottom='16px'; r.style.zIndex='9999'; r.style.display='flex'; r.style.flexDirection='column'; r.style.gap='8px'; document.body.appendChild(r);} return r; }
function showToast(msg,type='info'){ const r=ensureToastRoot(); const el=document.createElement('div'); el.style.padding='10px 12px'; el.style.borderRadius='10px'; el.style.color='#0f172a'; el.style.background= type==='error' ? '#fee2e2' : (type==='success'?'#dcfce7':'#e2e8f0'); el.style.border='1px solid rgba(0,0,0,.06)'; el.textContent=msg; r.appendChild(el); setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=> r.removeChild(el), 300); }, 2200); }

// apply units on load
loadUnits();

// patch unit toggle to persist
function wireUnitToggles(){
  document.querySelectorAll('.unit-btn').forEach(btn => {
    btn.onclick = () => {
      const type = btn.getAttribute('data-type');
      const unit = btn.getAttribute('data-unit');
      document.querySelectorAll(`.unit-btn[data-type="${type}"]`).forEach(b=> b.classList.remove('active'));
      btn.classList.add('active');
      unitState[type] = unit;
      saveUnits();
      updateUnitLabels();
    };
  });
}

// restore active unit buttons after load
(function restoreUnitButtons(){
  document.addEventListener('DOMContentLoaded', ()=>{
    document.querySelectorAll('.unit-btn').forEach(btn=>{
      const type=btn.getAttribute('data-type'); const unit=btn.getAttribute('data-unit');
      if(unitState[type]===unit) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    updateUnitLabels();
  });
})();

// --- Tabs: persist last active ---
// Shared tab activation
function activateTab(tabId){
  const tabs=document.querySelectorAll('.progress-tab');
  const panes=document.querySelectorAll('.progress-tab-pane');
  if(!document.getElementById(tabId)) return;
  
  // Deactivate all tabs and panes with ARIA updates
  tabs.forEach(t=>{
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
    t.setAttribute('tabindex', '-1');
  });
  panes.forEach(p=>p.classList.remove('active'));
  
  // Activate target tab and pane with ARIA updates
  const tabEl=document.querySelector(`.progress-tab[data-tab="${tabId}"]`);
  const paneEl = document.getElementById(tabId);
  
  if(tabEl) {
    tabEl.classList.add('active');
    tabEl.setAttribute('aria-selected', 'true');
    tabEl.setAttribute('tabindex', '0');
  }
  
  if(paneEl) {
    paneEl.classList.add('active');
  }
  
  // Update URL without page reload
  const url = new URL(window.location);
  url.searchParams.set('tab', tabId);
  window.history.replaceState({}, '', url);
  
  try{ localStorage.setItem(LS_TAB_KEY, tabId); }catch(_){}
  loadTabData(tabId);
}

function setupTabEvents() {
  const tabs = document.querySelectorAll('.progress-tab');
  const panes = document.querySelectorAll('.progress-tab-pane');

  // restore last tab from URL or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab');
  const last = tabFromUrl || localStorage.getItem(LS_TAB_KEY);
  if (last && document.getElementById(last)) {
    activateTab(last);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activateTab(tab.dataset.tab);
    });

    // Keyboard navigation
    tab.addEventListener('keydown', (e) => {
      const currentIndex = Array.from(tabs).indexOf(tab);
      let targetIndex = currentIndex;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          targetIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
          break;
        case 'ArrowRight':
          e.preventDefault();
          targetIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'Home':
          e.preventDefault();
          targetIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          targetIndex = tabs.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          activateTab(tab.dataset.tab);
          return;
        default:
          return;
      }

      // Update focus and activate tab
      tabs[targetIndex].focus();
      activateTab(tabs[targetIndex].dataset.tab);
    });
  });

  // Delegation fallback: works even if buttons are re-rendered
  const tabContainer=document.querySelector('.progress-tabs');
  if(tabContainer){
    tabContainer.addEventListener('click', (e)=>{
      const btn=e.target.closest('.progress-tab');
      if(!btn) return;
      activateTab(btn.dataset.tab);
    });
  }

  // Ensure there is an active pane on first load
  if(!document.querySelector('.progress-tab-pane.active')){
    const first=document.querySelector('.progress-tab');
    if(first) activateTab(first.dataset.tab);
  }
}

function loadTabData(tabId) {
  switch (tabId) {
    case 'overview':
      loadOverviewData();
      break;
    case 'body-stats':
      initMeasurements();
      break;
    case 'performance':
      initGoals();
      break;
    case 'photos':
      // loadPhotosData(); // TODO
      break;
  }
}

async function loadOverviewData() {
    const measurements = await fetchMeasurements();
    const summary = await fetchProgressSummary();
    renderOverviewChart(measurements);
    renderMilestones(summary.goals || []);
    renderPRs(summary.prs || []);
}

function renderOverviewChart(measurements) {
  const ctx = document.getElementById('overview-chart')?.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart
  if (currentChart) {
    currentChart.destroy();
  }

  const labels = measurements.map(m => m.date).reverse();
  const weightData = measurements.map(m => m.weight_kg).reverse();
  const bodyFatData = measurements.map(m => m.body_fat_percentage).reverse();

  // Performance optimizations for large datasets
  const isLargeDataset = labels.length > 100;
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    parsing: false, // Skip parsing for better performance
    animation: !isLargeDataset, // Disable animations for large datasets
    spanGaps: true, // Connect points across gaps
    cubicInterpolationMode: 'monotone', // Smooth curves
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {}
  };

  // Add decimation plugin for large datasets
  if (isLargeDataset && Chart.plugins && Chart.plugins.getPlugin('decimation')) {
    chartOptions.plugins.decimation = {
      enabled: true,
      algorithm: 'lttb',
      samples: 100
    };
  }

  currentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Weight (kg)',
          data: weightData,
          borderColor: '#ff6b35',
          backgroundColor: 'rgba(255, 107, 53, 0.1)',
          fill: true,
          yAxisID: 'y',
          tension: 0.4, // Smooth curves
        },
        {
          label: 'Body Fat (%)',
          data: bodyFatData,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          yAxisID: 'y1',
          tension: 0.4, // Smooth curves
        }
      ]
    },
    options: { ...MAR_CHART_OPTS, ...chartOptions }
  });
  
  // Store chart instance globally for optimistic updates
  window.__overviewChart = currentChart;
}

function renderMilestones(goals) {
    const container = document.getElementById('milestones-list');
    if (!container) return;
    if (!goals || goals.length === 0) {
        container.innerHTML = '<p>No active goals. Set one in the Performance tab!</p>';
        return;
    }
    container.innerHTML = goals.map(goal => `
        <div class="milestone-item">
            <div class="milestone-item__title">${goal.goal_type.replace('_', ' ')}</div>
            <div class="milestone-item__progress-bar">
                <div class="milestone-item__progress" style="width: ${goal.percent || 0}%"></div>
            </div>
            <div class="milestone-item__details">
                <span>${goal.percent || 0}%</span>
                <span>Target: ${goal.target_value}</span>
            </div>
        </div>
    `).join('');
}

function renderPRs(prs) {
    const container = document.getElementById('prs-list');
    if (!container) return;
    if (!prs || prs.length === 0) {
        container.innerHTML = '<p>No personal records yet. Keep logging workouts!</p>';
        return;
    }
    container.innerHTML = prs.slice(0, 5).map(pr => `
        <div class="pr-item">
            <span class="pr-item__exercise">${pr.exercise}</span>
            <span class="pr-item__weight">${pr.max_weight} kg</span>
        </div>
    `).join('');
}

async function fetchPhotos(params=''){ try{ const resp=await apiFetch(`http://127.0.0.1:8000/api/progress-photos/${params}`); if(!resp.ok) return []; const data=await resp.json(); return Array.isArray(data)?data:(data.results||[]);}catch(e){return[];} }
async function createPhoto(formData){ const resp=await apiFetch('http://127.0.0.1:8000/api/progress-photos/',{ method:'POST', body:formData }); if(!resp.ok) throw new Error('upload failed'); return resp.json(); }

function dataURLToBlob(dataURL){ const parts=dataURL.split(','); const mime=parts[0].match(/:(.*?);/)[1]; const bstr=atob(parts[1]); let n=bstr.length; const u8=new Uint8Array(n); while(n--){u8[n]=bstr.charCodeAt(n);} return new Blob([u8],{type:mime}); }

async function compressImage(file,maxW=1200,maxH=1200,quality=0.8){ return new Promise((resolve,reject)=>{ const img=new Image(); const url=URL.createObjectURL(file); img.onload=()=>{ let {width:w,height:h}=img; const ratio=Math.min(maxW/w,maxH/h,1); const cw=Math.round(w*ratio), ch=Math.round(h*ratio); const canvas=document.createElement('canvas'); canvas.width=cw; canvas.height=ch; const ctx=canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,cw,ch); ctx.drawImage(img,0,0,cw,ch); canvas.toBlob(blob=>{ URL.revokeObjectURL(url); if(blob) resolve(blob); else reject(new Error('toBlob failed')); },'image/jpeg',quality); }; img.onerror=reject; img.src=url; }); }

function renderMonthFilter(photos){ const sel=document.getElementById('photo-month-filter'); if(!sel) return; const months=new Set(['all']); photos.forEach(p=>{ const d=new Date(p.created_at||p.date||p.uploaded_at); const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; months.add(key); }); sel.innerHTML=Array.from(months).sort().map(m=>`<option value="${m}">${m==='all'?'All Months':m}</option>`).join(''); }

function renderGallery(photos){ const grid=document.getElementById('photo-timeline-gallery'); if(!grid) return; grid.innerHTML=photos.map(p=>{ const d=new Date(p.created_at||p.date||Date.now()); const ds=d.toLocaleDateString(); const url=p.image||p.url||p.photo_url; return `<div class="gallery-item"><img src="${url}" alt="Progress photo ${ds}"/><span class="date-badge">${ds}</span></div>`; }).join(''); }

function renderBeforeAfter(photos){ const a=document.getElementById('ba-after'), b=document.getElementById('ba-before'), s=document.getElementById('ba-slider'); if(!a||!b||!s) return; const sorted=photos.slice().sort((x,y)=> new Date(x.created_at||x.date)-new Date(y.created_at||y.date)); if(sorted.length<2){ a.removeAttribute('src'); b.removeAttribute('src'); return; } const last=sorted[sorted.length-1]; const prev=sorted[sorted.length-2]; a.src=last.image||last.url||last.photo_url; b.src=prev.image||prev.url||prev.photo_url; const overlay=document.querySelector('.ba-overlay'); s.oninput=()=>{ overlay.style.clipPath=`inset(0 ${100-s.value}% 0 0)`; }; s.dispatchEvent(new Event('input')); }

function wirePhotoUpload(){ const btn=document.getElementById('add-photo-btn'); const input=document.getElementById('photo-file-input'); const dz=document.getElementById('photo-dropzone'); const bar=document.querySelector('#photo-upload-progress>div'); if(!btn||!input||!dz) return; const openPicker=()=>input.click(); btn.onclick=openPicker; dz.onclick=openPicker; const handleFiles=async files=>{ if(!files||!files.length) return; const prog=document.getElementById('photo-upload-progress'); prog.style.display='block'; bar.style.width='0%'; let done=0; for(const file of files){ try{ const compressed=await compressImage(file,1600,1600,0.82); const form=new FormData(); form.append('image',compressed,file.name.replace(/\.[^.]+$/,'.jpg')); form.append('source','web'); await createPhoto(form); }catch(e){ console.error('upload',e); } finally { done++; bar.style.width=Math.round((done/files.length)*100)+'%'; } } setTimeout(()=>{ prog.style.display='none'; },400); await loadPhotosData(); };
 input.onchange=e=> handleFiles(e.target.files);
 dz.addEventListener('dragover',e=>{ e.preventDefault(); dz.classList.add('dragover'); });
 dz.addEventListener('dragleave',()=> dz.classList.remove('dragover'));
 dz.addEventListener('drop',e=>{ e.preventDefault(); dz.classList.remove('dragover'); handleFiles(e.dataTransfer.files); }); }

async function loadPhotosData(){ const photos=await fetchPhotos(); renderMonthFilter(photos); const sel=document.getElementById('photo-month-filter'); const apply=()=>{ const val=sel.value; const filtered= val==='all'? photos : photos.filter(p=>{ const d=new Date(p.created_at||p.date); const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; return key===val; }); renderGallery(filtered); renderBeforeAfter(filtered); }; sel.onchange=apply; apply(); }

// extend loadTabData
const __loadTabData = loadTabData;
loadTabData = function(tabId){ if(tabId==='photos'){ wirePhotoUpload(); loadPhotosData(); } return __loadTabData(tabId); }

// integrate toasts into saves/uploads
const __createMeasurementToast = createMeasurement;
createMeasurement = async function(payload){
  try{ const res = await __createMeasurementToast(payload); showToast('Measurement saved','success'); return res; }
  catch(e){ showToast('Failed to save measurement','error'); throw e; }
}

// wire photo toasts
const __createPhoto = createPhoto;
createPhoto = async function(form){ try{ const r=await __createPhoto(form); showToast('Photo uploaded','success'); return r;} catch(e){ showToast('Photo upload failed','error'); throw e; } }

