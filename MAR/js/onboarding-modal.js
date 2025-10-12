(function(){
  const scrim = document.getElementById('onboarding-scrim');
  const modal = document.getElementById('onboarding-modal');
  if (!scrim || !modal) return;

  const steps = ['welcome', 'goal', 'schedule', 'equipment', 'contra', 'notify', 'success'];
  let idx = 0;
  const data = {};

  function $(sel, root){ return (root||document).querySelector(sel); }
  function all(sel, root){ return Array.from((root||document).querySelectorAll(sel)); }

  function show(i){
    idx = i;
    all('.step', modal).forEach(el => el.classList.add('hidden'));
    const id = steps[idx];
    const el = modal.querySelector(`[data-step="${id}"]`);
    el && el.classList.remove('hidden');

    $('#onb-title').textContent = {
      welcome: 'Let’s tailor your training',
      goal: 'What’s your primary goal?',
      schedule: 'How many days can you train?',
      equipment: 'What equipment do you have access to?',
      contra: 'Anything we should avoid?',
      notify: 'Stay on track?',
      success: 'You’re all set'
    }[id] || 'Onboarding';

    all('[data-dot]', modal).forEach((d, j) => {
      d.classList.toggle('bg-orange-600', j === idx);
      d.classList.toggle('bg-gray-300', j !== idx);
    });

    $('#onb-back').disabled = idx === 0;
    $('#onb-next').classList.toggle('hidden', idx >= steps.length - 2);
    $('#onb-finish').classList.toggle('hidden', idx < steps.length - 2);
    $('#onb-skip').classList.toggle('hidden', idx === 0 || idx >= steps.length - 2);
  }

  function collectAllData() {
    const collected = {};
    // Goal
    collected.primary_goal = $('input[name="primary_goal"]:checked', modal)?.value || 'general_fitness';
    // Schedule
    collected.workout_frequency = Number($('.segmented__btn.is-selected', $('#days-group', modal))?.dataset.days) || 4;
    collected.preferred_workout_time = $('#pref_time', modal).value;
    // Equipment
    collected.available_equipment = all('.pill.is-selected', $('#equip-group', modal)).map(b => b.dataset.equip).join(',');
    // Contraindications
    const contraFlags = all('#contra-group input[type="checkbox"]:checked', modal).map(i => i.value);
    const contraNotes = $('#contra-notes', modal).value?.slice(0, 200) || '';
    
    // We handle contraindications separately
    const contraindicationsPayload = { flags: contraFlags, notes: contraNotes };

    // Mark onboarding as complete
    collected.completed_onboarding_at = new Date().toISOString();

    return { profileData: collected, contraindications: contraindicationsPayload };
  }

  async function saveProfile(payload) {
    try {
      // First, get the profile to find its ID for the PATCH URL
      const profile = await apiFetch('/api/v1/profile/');
      if (!profile.ok) throw new Error('Could not fetch user profile.');
      const profileData = await profile.json();
      const profileId = profileData.id;

      if (!profileId) throw new Error('Profile ID not found.');

      // Now, update the profile with the onboarding data
      const response = await apiFetch(`/api/v1/profile/${profileId}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload.profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to save profile:', errorData);
        throw new Error('Failed to save profile');
      }
      
      console.log('✅ Onboarding profile data saved successfully!');
      return await response.json();
    } catch (e) {
      console.error('Onboarding save failed', e);
      // In a real app, you'd show a user-facing error here
    }
  }

  function wireControls(){
    all('.segmented__btn', modal).forEach(btn => {
      btn.addEventListener('click', () => {
        all('.segmented__btn', btn.parentElement).forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
      });
    });
    all('.pill', modal).forEach(p => {
      p.addEventListener('click', () => p.classList.toggle('is-selected'));
    });
  }

  function next(){
    const currentStep = steps[idx];
    if (idx < steps.length - 2) {
      show(idx + 1);
    }
  }

  async function finish(){
    const payload = collectAllData();
    await saveProfile(payload);
    show(steps.indexOf('success'));
    // Optionally, trigger a page refresh or dashboard data reload
    if (window.dashboardManager) {
      window.dashboardManager.populateDashboardData();
    }
  }

  $('#onb-back')?.addEventListener('click', () => { if (idx > 0) show(idx - 1); });
  $('#onb-next')?.addEventListener('click', next);
  $('#onb-finish')?.addEventListener('click', finish);
  $('#onb-skip')?.addEventListener('click', close);
  $('#onb-start')?.addEventListener('click', () => { close(); document.getElementById('start-suggested-workout-btn')?.focus(); });

  function open(){
    scrim.classList.remove('hidden');
    modal.classList.remove('hidden');
    wireControls();
    show(0);
  }

  function close(){
    scrim.classList.add('hidden');
    modal.classList.add('hidden');
  }

  window.OnboardingModal = { open, close };
})();


