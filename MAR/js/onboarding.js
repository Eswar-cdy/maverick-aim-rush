(function(){
  async function getStatus(){
    const res = await fetch('http://127.0.0.1:8000/api/onboarding/status', { credentials: 'include' });
    return await res.json();
  }

  function getCsrf(){
    try { return document.cookie.match(/(?:^|;)\s*csrf_token=([^;]+)/)?.[1]; } catch(e){ return null; }
  }

  async function saveStep(step, answers){
    const headers = { 'Content-Type': 'application/json' };
    const csrf = getCsrf();
    if (csrf) headers['X-CSRF-Token'] = csrf;
    headers['Idempotency-Key'] = (crypto?.randomUUID?.() || String(Date.now()));
    const res = await fetch('http://127.0.0.1:8000/api/onboarding/answers', {
      method: 'POST', credentials: 'include', headers,
      body: JSON.stringify({ version: 'v1', step, answers })
    });
    return await res.json();
  }

  async function complete(){
    const headers = {};
    const csrf = getCsrf();
    if (csrf) headers['X-CSRF-Token'] = csrf;
    headers['Idempotency-Key'] = (crypto?.randomUUID?.() || String(Date.now()));
    const res = await fetch('http://127.0.0.1:8000/api/onboarding/complete', { method: 'POST', credentials: 'include', headers });
    return await res.json();
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const status = await getStatus();
      if (status.completed) {
        window.location.replace('about.html');
        return;
      }
    } catch(e) {}

    const nextBtn = document.getElementById('next-btn');
    nextBtn?.addEventListener('click', async () => {
      const payload = {
        primary_goal: document.getElementById('primary_goal').value,
        target_days: Number(document.getElementById('target_days').value || 4),
      };
      await saveStep('goals', payload);
      await complete();
      document.getElementById('step-goals').classList.add('hidden');
      document.getElementById('step-done').classList.remove('hidden');
    });
  });
})();

// Onboarding functionality for Maverick Aim Rush
// MAR/js/onboarding.js

class OnboardingFlow {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {};
        this.init();
    }

    init() {
        // Check authentication
        if (!getAccessToken()) {
            window.location.href = 'index.html';
            return;
        }

        this.bindEventListeners();
        this.updateProgress();
        this.updateNavigation();
    }

    bindEventListeners() {
        // Navigation buttons
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        const completeBtn = document.getElementById('complete-btn');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevStep());
        }

        if (completeBtn) {
            completeBtn.addEventListener('click', (e) => this.completeOnboarding(e));
        }

        // Unit system change handler
        const unitRadios = document.querySelectorAll('input[name="unit_system"]');
        unitRadios.forEach(radio => {
            radio.addEventListener('change', (e) => this.handleUnitChange(e.target.value));
        });

        // Form validation
        const form = document.getElementById('onboarding-form');
        if (form) {
            form.addEventListener('input', () => this.validateCurrentStep());
        }
    }

    nextStep() {
        if (!this.validateCurrentStep()) {
            return;
        }

        this.saveCurrentStepData();
        
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.showStep(this.currentStep);
            this.updateProgress();
            this.updateNavigation();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateProgress();
            this.updateNavigation();
        }
    }

    showStep(stepNumber) {
        // Hide all steps
        for (let i = 1; i <= this.totalSteps; i++) {
            const step = document.getElementById(`step-${i}`);
            if (step) {
                step.style.display = 'none';
            }
        }

        // Show current step
        const currentStep = document.getElementById(`step-${stepNumber}`);
        if (currentStep) {
            currentStep.style.display = 'block';
        }
    }

    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        const progressStep = document.getElementById('progress-step');

        if (progressFill) {
            const percentage = (this.currentStep / this.totalSteps) * 100;
            progressFill.style.width = `${percentage}%`;
        }

        if (progressStep) {
            progressStep.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
        }
    }

    updateNavigation() {
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        const completeBtn = document.getElementById('complete-btn');

        // Show/hide previous button
        if (prevBtn) {
            prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        }

        // Show/hide next vs complete button
        if (nextBtn && completeBtn) {
            if (this.currentStep === this.totalSteps) {
                nextBtn.style.display = 'none';
                completeBtn.style.display = 'block';
            } else {
                nextBtn.style.display = 'block';
                completeBtn.style.display = 'none';
            }
        }
    }

    validateCurrentStep() {
        const currentStepElement = document.getElementById(`step-${this.currentStep}`);
        if (!currentStepElement) return false;

        const requiredInputs = currentStepElement.querySelectorAll('input[required], select[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
            if (input.type === 'radio') {
                const radioGroup = currentStepElement.querySelectorAll(`input[name="${input.name}"]`);
                const isChecked = Array.from(radioGroup).some(radio => radio.checked);
                if (!isChecked) {
                    isValid = false;
                    this.showFieldError(input, 'Please select an option');
                } else {
                    this.clearFieldError(input);
                }
            } else if (input.type === 'checkbox') {
                // For equipment checkboxes, at least one should be selected
                const checkboxGroup = currentStepElement.querySelectorAll(`input[name="${input.name}"]`);
                const isChecked = Array.from(checkboxGroup).some(checkbox => checkbox.checked);
                if (!isChecked) {
                    isValid = false;
                    this.showFieldError(input, 'Please select at least one option');
                } else {
                    this.clearFieldError(input);
                }
            } else {
                if (!input.value.trim()) {
                    isValid = false;
                    this.showFieldError(input, 'This field is required');
                } else {
                    this.clearFieldError(input);
                }
            }
        });

        return isValid;
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        
        input.parentNode.appendChild(errorElement);
        input.classList.add('error');
    }

    clearFieldError(input) {
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        input.classList.remove('error');
    }

    saveCurrentStepData() {
        const currentStepElement = document.getElementById(`step-${this.currentStep}`);
        if (!currentStepElement) return;

        const inputs = currentStepElement.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            if (input.type === 'radio' && input.checked) {
                this.formData[input.name] = input.value;
            } else if (input.type === 'checkbox') {
                if (!this.formData[input.name]) {
                    this.formData[input.name] = [];
                }
                if (input.checked) {
                    this.formData[input.name].push(input.value);
                }
            } else if (input.type !== 'radio' && input.type !== 'checkbox') {
                this.formData[input.name] = input.value;
            }
        });
    }

    handleUnitChange(unitSystem) {
        const heightInput = document.getElementById('height');
        const weightInput = document.getElementById('weight');
        const heightUnit = document.getElementById('height-unit');
        const weightUnit = document.getElementById('weight-unit');

        if (unitSystem === 'imperial') {
            // Convert to imperial
            if (heightInput.value) {
                const cm = parseFloat(heightInput.value);
                const feet = Math.floor(cm / 30.48);
                const inches = Math.round((cm % 30.48) / 2.54);
                heightInput.value = feet * 12 + inches; // Store as total inches
            }
            if (weightInput.value) {
                const kg = parseFloat(weightInput.value);
                const lbs = Math.round(kg * 2.20462);
                weightInput.value = lbs;
            }
            
            heightUnit.textContent = 'inches';
            weightUnit.textContent = 'lbs';
        } else {
            // Convert to metric
            if (heightInput.value) {
                const inches = parseFloat(heightInput.value);
                const cm = Math.round(inches * 2.54);
                heightInput.value = cm;
            }
            if (weightInput.value) {
                const lbs = parseFloat(weightInput.value);
                const kg = Math.round(lbs / 2.20462 * 10) / 10;
                weightInput.value = kg;
            }
            
            heightUnit.textContent = 'cm';
            weightUnit.textContent = 'kg';
        }
    }

    async completeOnboarding(e) {
        e.preventDefault();

        if (!this.validateCurrentStep()) {
            return;
        }

        this.saveCurrentStepData();

        const completeBtn = document.getElementById('complete-btn');
        if (completeBtn) {
            completeBtn.textContent = 'Setting up...';
            completeBtn.disabled = true;
        }

        try {
            // Prepare profile data
            const profileData = this.prepareProfileData();
            
            // Update user profile
            await updateUserProfile(profileData);
            
            // Create initial body measurement
            await this.createInitialMeasurement();
            
            // Calculate initial macro targets
            await this.createInitialMacroTargets();
            
            // Show success and redirect
            this.showSuccess('Welcome to Maverick Aim Rush! Your profile has been set up successfully.');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);

        } catch (error) {
            console.error('Onboarding failed:', error);
            this.showError('Failed to complete setup. Please try again.');
        } finally {
            if (completeBtn) {
                completeBtn.textContent = 'Complete Setup';
                completeBtn.disabled = false;
            }
        }
    }

    prepareProfileData() {
        const data = {
            age: parseInt(this.formData.age),
            gender: this.formData.gender,
            fitness_level: this.formData.fitness_level,
            primary_goal: this.formData.primary_goal,
            workout_frequency: parseInt(this.formData.workout_frequency),
            workout_duration_preference: parseInt(this.formData.workout_duration),
            preferred_workout_time: this.formData.workout_time,
            unit_system: this.formData.unit_system,
            available_equipment: this.formData.equipment ? this.formData.equipment.join(',') : ''
        };

        // Convert height and weight to metric for storage
        if (this.formData.unit_system === 'imperial') {
            // Height: inches to cm
            data.height_cm = Math.round(parseFloat(this.formData.height) * 2.54);
            // Weight: lbs to kg
            data.weight_kg = Math.round(parseFloat(this.formData.weight) / 2.20462 * 10) / 10;
        } else {
            data.height_cm = parseFloat(this.formData.height);
            data.weight_kg = parseFloat(this.formData.weight);
        }

        return data;
    }

    async createInitialMeasurement() {
        const measurementData = {
            date: new Date().toISOString().split('T')[0],
            weight_kg: this.formData.unit_system === 'imperial' 
                ? Math.round(parseFloat(this.formData.weight) / 2.20462 * 10) / 10
                : parseFloat(this.formData.weight),
            height_cm: this.formData.unit_system === 'imperial'
                ? Math.round(parseFloat(this.formData.height) * 2.54)
                : parseFloat(this.formData.height)
        };

        try {
            await apiFetch('/measurements/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(measurementData),
            });
        } catch (error) {
            console.error('Failed to create initial measurement:', error);
            // Don't throw - this is not critical for onboarding
        }
    }

    async createInitialMacroTargets() {
        try {
            await createMacroTarget(this.formData.primary_goal);
        } catch (error) {
            console.error('Failed to create initial macro targets:', error);
            // Don't throw - this is not critical for onboarding
        }
    }

    showSuccess(message) {
        // Simple success display
        alert(`Success: ${message}`);
    }

    showError(message) {
        // Simple error display
        alert(`Error: ${message}`);
    }
}

// Initialize onboarding when page loads
document.addEventListener('DOMContentLoaded', () => {
    new OnboardingFlow();
});
