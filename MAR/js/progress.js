// Progress Analytics Renderer (list-based UI)

let cachedSummary = null;
let currentRange = 'all'; // '7' | '30' | '90' | 'all'

async function fetchProgressSummary() {
  try {
    const resp = await apiFetch('http://127.0.0.1:8000/api/progress/summary/');
    if (!resp.ok) throw new Error('Failed to fetch progress summary');
    return await resp.json();
  } catch (e) {
    console.error('Progress summary error', e);
    return { volume_trend: [], prs: [], sessions_per_week: [], recent_sessions: [], kpis: {} };
  }
}

async function fetchExerciseTrend(exerciseId) {
  try {
    const resp = await apiFetch(`http://127.0.0.1:8000/api/progress/exercise-trend/?exercise_id=${encodeURIComponent(exerciseId)}`);
    if (!resp.ok) throw new Error('Failed to fetch exercise trend');
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
      const oldText = btn.textContent; btn.textContent = 'Saving...'; btn.disabled = true;
      await createMeasurement(payload);
      const list = await fetchMeasurements();
      renderMeasurements(list);
      btn.textContent = 'Saved'; setTimeout(()=>{ btn.textContent = oldText; btn.disabled = false; }, 1000);
    } catch (e) {
      const oldText = btn.textContent; btn.textContent = 'Failed'; setTimeout(()=>{ btn.textContent = oldText; btn.disabled = false; }, 1200);
      alert('Failed to save measurement. Make sure you are logged in.');
    }
  };
}

async function initMeasurements() {
  const list = await fetchMeasurements();
  renderMeasurements(list);
  // Render measurement trends
  const trends = computeMeasurementTrends(list);
  renderMeasurementTrends(trends);
  wireMeasurementForm();
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
  const maxPr = Math.max(...prs.map(p=>p.max_weight||0), 0);
  renderList('list-prs', prs.map(p => `
    <div class="list-row pr-row" data-ex-id="${p.exercise_id}" data-ex-name="${p.exercise}" style="cursor:pointer;padding:.5rem 0;border-bottom:1px solid #eee;display:flex;justify-content:space-between;gap:1rem;align-items:center;">
      <div>${p.exercise}</div>
      <div style="flex:1;">${bar(p.max_weight||0, maxPr, (p.max_weight||0)+' kg')}</div>
    </div>
  `).join(''));
  document.querySelectorAll('.pr-row').forEach(el => {
    el.onclick = () => renderExerciseDrilldown(el.getAttribute('data-ex-id'), el.getAttribute('data-ex-name'));
  });

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

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('list-sessions')) {
    initProgressLists();
    initMeasurements();
    initGoals();
  }
});
