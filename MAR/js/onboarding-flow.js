// Comprehensive Onboarding Flow for New Users
// Collects profile data, goals, and preferences for personalized recommendations

class OnboardingFlow {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 6;
        this.userData = {
            profile: {},
            goals: {},
            preferences: {},
            equipment: [],
            dietary: {}
        };
        this.init();
    }

    init() {
        this.createOnboardingModal();
        this.checkIfOnboardingNeeded();
    }

    checkIfOnboardingNeeded() {
        // Check if user has completed onboarding
        const onboardingCompleted = localStorage.getItem('onboarding_completed');
        const userProfile = localStorage.getItem('user_profile');
        
        if (!onboardingCompleted || !userProfile) {
            // Show onboarding for new users
            setTimeout(() => {
                this.showOnboarding();
            }, 1000);
        }
    }

    createOnboardingModal() {
        const modalHTML = `
            <div id="onboarding-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:2000; backdrop-filter:blur(4px);">
                <div style="max-width: 800px; margin: 2vh auto; background:#0f172a; color:#e5e7eb; border-radius:20px; overflow:hidden; box-shadow: 0 25px 80px rgba(0,0,0,0.7); max-height: 96vh; overflow-y: auto;">
                    
                    <!-- Header -->
                    <div style="padding:2rem; background: linear-gradient(135deg,#8b5cf6,#7c3aed); text-align:center; position:relative;">
                        <h2 style="margin:0; font-size:1.5rem; font-weight:700; color:white;">🎯 Welcome to Maverick Aim Rush!</h2>
                        <p style="margin:0.5rem 0 0 0; color:rgba(255,255,255,0.9); font-size:1rem;">Let's personalize your fitness journey</p>
                        <div style="position:absolute; top:1rem; right:1rem; background:rgba(255,255,255,0.2); color:white; padding:0.25rem 0.75rem; border-radius:12px; font-size:0.875rem; font-weight:600;">
                            Step <span id="onboarding-step">1</span> of ${this.totalSteps}
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div style="height:4px; background:#1e293b;">
                        <div id="onboarding-progress" style="height:100%; background:linear-gradient(90deg,#10b981,#059669); width:16.67%; transition:width 0.3s ease;"></div>
                    </div>

                    <!-- Content -->
                    <div style="padding:2rem;">
                        <div id="onboarding-content">
                            <!-- Content will be populated dynamically -->
                        </div>
                    </div>

                    <!-- Navigation -->
                    <div style="padding:1.5rem 2rem; display:flex; justify-content:space-between; align-items:center; background:#0b1220; border-top:1px solid #1e293b;">
                        <button id="onboarding-back" onclick="onboardingFlow.previousStep()" style="background:#374151; color:white; border:none; padding:0.75rem 1.5rem; border-radius:12px; cursor:pointer; font-weight:600; display:none;">
                            ← Back
                        </button>
                        <div style="flex:1;"></div>
                        <button id="onboarding-next" onclick="onboardingFlow.nextStep()" style="background:linear-gradient(135deg,#10b981,#059669); color:white; border:none; padding:0.75rem 2rem; border-radius:12px; cursor:pointer; font-weight:700; font-size:1rem;">
                            Next →
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    showOnboarding() {
        const modal = document.getElementById('onboarding-modal');
        if (modal) {
            modal.style.display = 'block';
            this.renderCurrentStep();
        }
    }

    hideOnboarding() {
        const modal = document.getElementById('onboarding-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    renderCurrentStep() {
        const content = document.getElementById('onboarding-content');
        const stepIndicator = document.getElementById('onboarding-step');
        const progressBar = document.getElementById('onboarding-progress');
        const backBtn = document.getElementById('onboarding-back');
        const nextBtn = document.getElementById('onboarding-next');

        if (stepIndicator) stepIndicator.textContent = this.currentStep + 1;
        if (progressBar) progressBar.style.width = `${((this.currentStep + 1) / this.totalSteps) * 100}%`;
        if (backBtn) backBtn.style.display = this.currentStep > 0 ? 'block' : 'none';
        if (nextBtn) nextBtn.textContent = this.currentStep === this.totalSteps - 1 ? 'Complete Setup' : 'Next →';

        if (!content) return;

        switch (this.currentStep) {
            case 0:
                this.renderWelcomeStep(content);
                break;
            case 1:
                this.renderProfileStep(content);
                break;
            case 2:
                this.renderGoalsStep(content);
                break;
            case 3:
                this.renderExperienceStep(content);
                break;
            case 4:
                this.renderEquipmentStep(content);
                break;
            case 5:
                this.renderDietaryStep(content);
                break;
        }
    }

    renderWelcomeStep(content) {
        content.innerHTML = `
            <div style="text-align:center; padding:2rem 0;">
                <div style="font-size:4rem; margin-bottom:1rem;">🏋️‍♂️</div>
                <h3 style="margin:0 0 1rem 0; font-size:1.5rem; color:#10b981;">Let's Get Started!</h3>
                <p style="margin:0 0 2rem 0; color:#9ca3af; line-height:1.6; font-size:1.1rem;">
                    We'll ask you a few questions to create a personalized fitness experience. 
                    This will help us recommend the perfect workouts, meal plans, and track your progress effectively.
                </p>
                <div style="background:#1e293b; padding:1.5rem; border-radius:12px; margin:2rem 0;">
                    <h4 style="margin:0 0 1rem 0; color:#e5e7eb;">What we'll collect:</h4>
                    <ul style="margin:0; padding-left:1.5rem; color:#9ca3af; text-align:left;">
                        <li>Basic profile information (age, weight, height)</li>
                        <li>Your fitness goals and preferences</li>
                        <li>Experience level and workout frequency</li>
                        <li>Available equipment and space</li>
                        <li>Dietary preferences and restrictions</li>
                    </ul>
                </div>
                <p style="color:#6b7280; font-size:0.9rem;">
                    Don't worry - you can always update these settings later in your profile.
                </p>
            </div>
        `;
    }

    renderProfileStep(content) {
        content.innerHTML = `
            <div style="max-width:500px; margin:0 auto;">
                <h3 style="margin:0 0 2rem 0; text-align:center; color:#10b981;">📊 Basic Information</h3>
                
                <div style="display:grid; gap:1.5rem;">
                    <div>
                        <label style="display:block; margin-bottom:0.5rem; font-weight:600; color:#e5e7eb;">Age</label>
                        <input type="number" id="onboarding-age" placeholder="25" min="13" max="100" style="width:100%; padding:0.75rem; border-radius:8px; border:1px solid #374151; background:#111827; color:#e5e7eb; font-size:1rem;">
                    </div>
                    
                    <div>
                        <label style="display:block; margin-bottom:0.5rem; font-weight:600; color:#e5e7eb;">Weight (kg)</label>
                        <input type="number" id="onboarding-weight" placeholder="70" min="30" max="200" step="0.1" style="width:100%; padding:0.75rem; border-radius:8px; border:1px solid #374151; background:#111827; color:#e5e7eb; font-size:1rem;">
                    </div>
                    
                    <div>
                        <label style="display:block; margin-bottom:0.5rem; font-weight:600; color:#e5e7eb;">Height (cm)</label>
                        <input type="number" id="onboarding-height" placeholder="175" min="100" max="250" style="width:100%; padding:0.75rem; border-radius:8px; border:1px solid #374151; background:#111827; color:#e5e7eb; font-size:1rem;">
                    </div>
                    
                    <div>
                        <label style="display:block; margin-bottom:0.5rem; font-weight:600; color:#e5e7eb;">Gender</label>
                        <select id="onboarding-gender" style="width:100%; padding:0.75rem; border-radius:8px; border:1px solid #374151; background:#111827; color:#e5e7eb; font-size:1rem;">
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    renderGoalsStep(content) {
        content.innerHTML = `
            <div style="max-width:600px; margin:0 auto;">
                <h3 style="margin:0 0 2rem 0; text-align:center; color:#10b981;">🎯 What's Your Primary Goal?</h3>
                
                <div style="display:grid; gap:1rem; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));">
                    <label class="goal-option" style="display:block; padding:1.5rem; border:2px solid #374151; border-radius:12px; cursor:pointer; transition:all 0.3s ease; background:#111827;">
                        <input type="radio" name="primary-goal" value="weight_loss" style="display:none;">
                        <div style="text-align:center;">
                            <div style="font-size:2rem; margin-bottom:0.5rem;">🔥</div>
                            <h4 style="margin:0 0 0.5rem 0; color:#e5e7eb;">Weight Loss</h4>
                            <p style="margin:0; color:#9ca3af; font-size:0.9rem;">Burn fat and get lean</p>
                        </div>
                    </label>
                    
                    <label class="goal-option" style="display:block; padding:1.5rem; border:2px solid #374151; border-radius:12px; cursor:pointer; transition:all 0.3s ease; background:#111827;">
                        <input type="radio" name="primary-goal" value="muscle_gain" style="display:none;">
                        <div style="text-align:center;">
                            <div style="font-size:2rem; margin-bottom:0.5rem;">💪</div>
                            <h4 style="margin:0 0 0.5rem 0; color:#e5e7eb;">Muscle Gain</h4>
                            <p style="margin:0; color:#9ca3af; font-size:0.9rem;">Build strength and size</p>
                        </div>
                    </label>
                    
                    <label class="goal-option" style="display:block; padding:1.5rem; border:2px solid #374151; border-radius:12px; cursor:pointer; transition:all 0.3s ease; background:#111827;">
                        <input type="radio" name="primary-goal" value="general_fitness" style="display:none;">
                        <div style="text-align:center;">
                            <div style="font-size:2rem; margin-bottom:0.5rem;">⚡</div>
                            <h4 style="margin:0 0 0.5rem 0; color:#e5e7eb;">General Fitness</h4>
                            <p style="margin:0; color:#9ca3af; font-size:0.9rem;">Stay healthy and active</p>
                        </div>
                    </label>
                    
                    <label class="goal-option" style="display:block; padding:1.5rem; border:2px solid #374151; border-radius:12px; cursor:pointer; transition:all 0.3s ease; background:#111827;">
                        <input type="radio" name="primary-goal" value="endurance" style="display:none;">
                        <div style="text-align:center;">
                            <div style="font-size:2rem; margin-bottom:0.5rem;">🏃‍♂️</div>
                            <h4 style="margin:0 0 0.5rem 0; color:#e5e7eb;">Endurance</h4>
                            <p style="margin:0; color:#9ca3af; font-size:0.9rem;">Improve stamina and cardio</p>
                        </div>
                    </label>
                </div>
                
                <div style="margin-top:2rem;">
                    <label style="display:block; margin-bottom:0.5rem; font-weight:600; color:#e5e7eb;">Target Weight (kg) - Optional</label>
                    <input type="number" id="onboarding-target-weight" placeholder="65" min="30" max="200" step="0.1" style="width:100%; padding:0.75rem; border-radius:8px; border:1px solid #374151; background:#111827; color:#e5e7eb; font-size:1rem;">
                </div>
            </div>
        `;
        
        // Add click handlers for goal options
        setTimeout(() => {
            document.querySelectorAll('.goal-option').forEach(option => {
                option.addEventListener('click', () => {
                    document.querySelectorAll('.goal-option').forEach(o => {
                        o.style.borderColor = '#374151';
                        o.style.background = '#111827';
                    });
                    option.style.borderColor = '#10b981';
                    option.style.background = '#064e3b';
                    option.querySelector('input[type="radio"]').checked = true;
                });
            });
        }, 100);
    }

    renderExperienceStep(content) {
        content.innerHTML = `
            <div style="max-width:600px; margin:0 auto;">
                <h3 style="margin:0 0 2rem 0; text-align:center; color:#10b981;">🏋️‍♂️ Experience Level</h3>
                
                <div style="display:grid; gap:1rem;">
                    <label class="experience-option" style="display:block; padding:1.5rem; border:2px solid #374151; border-radius:12px; cursor:pointer; transition:all 0.3s ease; background:#111827;">
                        <input type="radio" name="experience-level" value="beginner" style="display:none;">
                        <div>
                            <h4 style="margin:0 0 0.5rem 0; color:#e5e7eb;">🟢 Beginner</h4>
                            <p style="margin:0; color:#9ca3af;">New to fitness or returning after a long break. Need guidance on form and basic exercises.</p>
                        </div>
                    </label>
                    
                    <label class="experience-option" style="display:block; padding:1.5rem; border:2px solid #374151; border-radius:12px; cursor:pointer; transition:all 0.3s ease; background:#111827;">
                        <input type="radio" name="experience-level" value="intermediate" style="display:none;">
                        <div>
                            <h4 style="margin:0 0 0.5rem 0; color:#e5e7eb;">🟡 Intermediate</h4>
                            <p style="margin:0; color:#9ca3af;">Have some experience with workouts. Comfortable with basic exercises and ready for progression.</p>
                        </div>
                    </label>
                    
                    <label class="experience-option" style="display:block; padding:1.5rem; border:2px solid #374151; border-radius:12px; cursor:pointer; transition:all 0.3s ease; background:#111827;">
                        <input type="radio" name="experience-level" value="advanced" style="display:none;">
                        <div>
                            <h4 style="margin:0 0 0.5rem 0; color:#e5e7eb;">🔴 Advanced</h4>
                            <p style="margin:0; color:#9ca3af;">Experienced with various training methods. Looking for challenging workouts and advanced techniques.</p>
                        </div>
                    </label>
                </div>
                
                <div style="margin-top:2rem;">
                    <label style="display:block; margin-bottom:0.5rem; font-weight:600; color:#e5e7eb;">How many days per week can you workout?</label>
                    <select id="onboarding-workout-frequency" style="width:100%; padding:0.75rem; border-radius:8px; border:1px solid #374151; background:#111827; color:#e5e7eb; font-size:1rem;">
                        <option value="">Select frequency</option>
                        <option value="2">2 days per week</option>
                        <option value="3">3 days per week</option>
                        <option value="4">4 days per week</option>
                        <option value="5">5 days per week</option>
                        <option value="6">6 days per week</option>
                        <option value="7">7 days per week</option>
                    </select>
                </div>
                
                <div style="margin-top:1.5rem;">
                    <label style="display:block; margin-bottom:0.5rem; font-weight:600; color:#e5e7eb;">Preferred workout duration (minutes)</label>
                    <select id="onboarding-workout-duration" style="width:100%; padding:0.75rem; border-radius:8px; border:1px solid #374151; background:#111827; color:#e5e7eb; font-size:1rem;">
                        <option value="">Select duration</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="75">75 minutes</option>
                        <option value="90">90 minutes</option>
                    </select>
                </div>
            </div>
        `;
        
        // Add click handlers for experience options
        setTimeout(() => {
            document.querySelectorAll('.experience-option').forEach(option => {
                option.addEventListener('click', () => {
                    document.querySelectorAll('.experience-option').forEach(o => {
                        o.style.borderColor = '#374151';
                        o.style.background = '#111827';
                    });
                    option.style.borderColor = '#10b981';
                    option.style.background = '#064e3b';
                    option.querySelector('input[type="radio"]').checked = true;
                });
            });
        }, 100);
    }

    renderEquipmentStep(content) {
        content.innerHTML = `
            <div style="max-width:600px; margin:0 auto;">
                <h3 style="margin:0 0 2rem 0; text-align:center; color:#10b981;">🏠 Available Equipment</h3>
                <p style="text-align:center; color:#9ca3af; margin-bottom:2rem;">Select all equipment you have access to:</p>
                
                <div style="display:grid; gap:1rem; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));">
                    <label class="equipment-option" style="display:block; padding:1rem; border:2px solid #374151; border-radius:8px; cursor:pointer; transition:all 0.3s ease; background:#111827; text-align:center;">
                        <input type="checkbox" name="equipment" value="bodyweight" style="display:none;">
                        <div style="font-size:1.5rem; margin-bottom:0.5rem;">🏃‍♂️</div>
                        <div style="font-weight:600; color:#e5e7eb;">Bodyweight Only</div>
                    </label>
                    
                    <label class="equipment-option" style="display:block; padding:1rem; border:2px solid #374151; border-radius:8px; cursor:pointer; transition:all 0.3s ease; background:#111827; text-align:center;">
                        <input type="checkbox" name="equipment" value="dumbbells" style="display:none;">
                        <div style="font-size:1.5rem; margin-bottom:0.5rem;">🏋️‍♂️</div>
                        <div style="font-weight:600; color:#e5e7eb;">Dumbbells</div>
                    </label>
                    
                    <label class="equipment-option" style="display:block; padding:1rem; border:2px solid #374151; border-radius:8px; cursor:pointer; transition:all 0.3s ease; background:#111827; text-align:center;">
                        <input type="checkbox" name="equipment" value="barbell" style="display:none;">
                        <div style="font-size:1.5rem; margin-bottom:0.5rem;">🏋️‍♀️</div>
                        <div style="font-weight:600; color:#e5e7eb;">Barbell</div>
                    </label>
                    
                    <label class="equipment-option" style="display:block; padding:1rem; border:2px solid #374151; border-radius:8px; cursor:pointer; transition:all 0.3s ease; background:#111827; text-align:center;">
                        <input type="checkbox" name="equipment" value="kettlebell" style="display:none;">
                        <div style="font-size:1.5rem; margin-bottom:0.5rem;">🥤</div>
                        <div style="font-weight:600; color:#e5e7eb;">Kettlebell</div>
                    </label>
                    
                    <label class="equipment-option" style="display:block; padding:1rem; border:2px solid #374151; border-radius:8px; cursor:pointer; transition:all 0.3s ease; background:#111827; text-align:center;">
                        <input type="checkbox" name="equipment" value="resistance-bands" style="display:none;">
                        <div style="font-size:1.5rem; margin-bottom:0.5rem;">🎯</div>
                        <div style="font-weight:600; color:#e5e7eb;">Resistance Bands</div>
                    </label>
                    
                    <label class="equipment-option" style="display:block; padding:1rem; border:2px solid #374151; border-radius:8px; cursor:pointer; transition:all 0.3s ease; background:#111827; text-align:center;">
                        <input type="checkbox" name="equipment" value="pull-up-bar" style="display:none;">
                        <div style="font-size:1.5rem; margin-bottom:0.5rem;">🆙</div>
                        <div style="font-weight:600; color:#e5e7eb;">Pull-up Bar</div>
                    </label>
                    
                    <label class="equipment-option" style="display:block; padding:1rem; border:2px solid #374151; border-radius:8px; cursor:pointer; transition:all 0.3s ease; background:#111827; text-align:center;">
                        <input type="checkbox" name="equipment" value="bench" style="display:none;">
                        <div style="font-size:1.5rem; margin-bottom:0.5rem;">🪑</div>
                        <div style="font-weight:600; color:#e5e7eb;">Bench</div>
                    </label>
                    
                    <label class="equipment-option" style="display:block; padding:1rem; border:2px solid #374151; border-radius:8px; cursor:pointer; transition:all 0.3s ease; background:#111827; text-align:center;">
                        <input type="checkbox" name="equipment" value="gym-access" style="display:none;">
                        <div style="font-size:1.5rem; margin-bottom:0.5rem;">🏢</div>
                        <div style="font-weight:600; color:#e5e7eb;">Gym Access</div>
                    </label>
                </div>
            </div>
        `;
        
        // Add click handlers for equipment options
        setTimeout(() => {
            document.querySelectorAll('.equipment-option').forEach(option => {
                option.addEventListener('click', () => {
                    const checkbox = option.querySelector('input[type="checkbox"]');
                    checkbox.checked = !checkbox.checked;
                    
                    if (checkbox.checked) {
                        option.style.borderColor = '#10b981';
                        option.style.background = '#064e3b';
                    } else {
                        option.style.borderColor = '#374151';
                        option.style.background = '#111827';
                    }
                });
            });
        }, 100);
    }

    renderDietaryStep(content) {
        content.innerHTML = `
            <div style="max-width:600px; margin:0 auto;">
                <h3 style="margin:0 0 2rem 0; text-align:center; color:#10b981;">🍎 Dietary Preferences</h3>
                
                <div style="margin-bottom:2rem;">
                    <label style="display:block; margin-bottom:0.5rem; font-weight:600; color:#e5e7eb;">Dietary Restrictions</label>
                    <div style="display:grid; gap:0.5rem; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));">
                        <label style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; background:#1e293b; border-radius:6px; cursor:pointer;">
                            <input type="checkbox" name="dietary-restrictions" value="vegetarian" style="transform:scale(1.2);">
                            <span style="color:#e5e7eb;">Vegetarian</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; background:#1e293b; border-radius:6px; cursor:pointer;">
                            <input type="checkbox" name="dietary-restrictions" value="vegan" style="transform:scale(1.2);">
                            <span style="color:#e5e7eb;">Vegan</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; background:#1e293b; border-radius:6px; cursor:pointer;">
                            <input type="checkbox" name="dietary-restrictions" value="gluten-free" style="transform:scale(1.2);">
                            <span style="color:#e5e7eb;">Gluten-Free</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; background:#1e293b; border-radius:6px; cursor:pointer;">
                            <input type="checkbox" name="dietary-restrictions" value="dairy-free" style="transform:scale(1.2);">
                            <span style="color:#e5e7eb;">Dairy-Free</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; background:#1e293b; border-radius:6px; cursor:pointer;">
                            <input type="checkbox" name="dietary-restrictions" value="keto" style="transform:scale(1.2);">
                            <span style="color:#e5e7eb;">Keto</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; background:#1e293b; border-radius:6px; cursor:pointer;">
                            <input type="checkbox" name="dietary-restrictions" value="paleo" style="transform:scale(1.2);">
                            <span style="color:#e5e7eb;">Paleo</span>
                        </label>
                    </div>
                </div>
                
                <div style="margin-bottom:2rem;">
                    <label style="display:block; margin-bottom:0.5rem; font-weight:600; color:#e5e7eb;">Current Daily Calorie Intake</label>
                    <input type="number" id="onboarding-current-calories" placeholder="2200" min="800" max="5000" step="50" style="width:100%; padding:0.75rem; border-radius:8px; border:1px solid #374151; background:#111827; color:#e5e7eb; font-size:1rem;">
                    <small style="color: #9ca3af; font-size: 0.875rem; margin-top: 0.25rem; display: block;">
                        💡 Our AI trainer will suggest your optimal target calories based on your goals and activity level
                    </small>
                </div>
                
                <div style="margin-bottom:2rem;">
                    <label style="display:block; margin-bottom:0.5rem; font-weight:600; color:#e5e7eb;">Cuisine Preferences</label>
                    <div style="display:grid; gap:0.5rem; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr));">
                        <label style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; background:#1e293b; border-radius:6px; cursor:pointer;">
                            <input type="checkbox" name="cuisine-preferences" value="mediterranean" style="transform:scale(1.2);">
                            <span style="color:#e5e7eb;">Mediterranean</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; background:#1e293b; border-radius:6px; cursor:pointer;">
                            <input type="checkbox" name="cuisine-preferences" value="asian" style="transform:scale(1.2);">
                            <span style="color:#e5e7eb;">Asian</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; background:#1e293b; border-radius:6px; cursor:pointer;">
                            <input type="checkbox" name="cuisine-preferences" value="mexican" style="transform:scale(1.2);">
                            <span style="color:#e5e7eb;">Mexican</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; background:#1e293b; border-radius:6px; cursor:pointer;">
                            <input type="checkbox" name="cuisine-preferences" value="italian" style="transform:scale(1.2);">
                            <span style="color:#e5e7eb;">Italian</span>
                        </label>
                    </div>
                </div>
                
                <div style="background:#1e293b; padding:1.5rem; border-radius:12px; margin-top:2rem;">
                    <h4 style="margin:0 0 1rem 0; color:#10b981;">🎉 You're Almost Done!</h4>
                    <p style="margin:0; color:#9ca3af; line-height:1.6;">
                        Once you complete this setup, we'll create your personalized fitness roadmap and start generating 
                        custom workout plans and meal suggestions based on your preferences.
                    </p>
                </div>
            </div>
        `;
    }

    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            this.saveCurrentStepData();
            this.currentStep++;
            this.renderCurrentStep();
        } else {
            this.completeOnboarding();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderCurrentStep();
        }
    }

    saveCurrentStepData() {
        switch (this.currentStep) {
            case 1: // Profile step
                this.userData.profile = {
                    age: document.getElementById('onboarding-age')?.value,
                    weight: document.getElementById('onboarding-weight')?.value,
                    height: document.getElementById('onboarding-height')?.value,
                    gender: document.getElementById('onboarding-gender')?.value
                };
                break;
            case 2: // Goals step
                const primaryGoal = document.querySelector('input[name="primary-goal"]:checked')?.value;
                this.userData.goals = {
                    primary_goal: primaryGoal,
                    target_weight: document.getElementById('onboarding-target-weight')?.value
                };
                break;
            case 3: // Experience step
                const experienceLevel = document.querySelector('input[name="experience-level"]:checked')?.value;
                this.userData.preferences = {
                    ...this.userData.preferences,
                    experience_level: experienceLevel,
                    workout_frequency: document.getElementById('onboarding-workout-frequency')?.value,
                    workout_duration: document.getElementById('onboarding-workout-duration')?.value
                };
                break;
            case 4: // Equipment step
                const equipment = Array.from(document.querySelectorAll('input[name="equipment"]:checked')).map(cb => cb.value);
                this.userData.equipment = equipment;
                break;
            case 5: // Dietary step
                const dietaryRestrictions = Array.from(document.querySelectorAll('input[name="dietary-restrictions"]:checked')).map(cb => cb.value);
                const cuisinePreferences = Array.from(document.querySelectorAll('input[name="cuisine-preferences"]:checked')).map(cb => cb.value);
                this.userData.dietary = {
                    restrictions: dietaryRestrictions,
                    preferences: cuisinePreferences,
                    current_calories: document.getElementById('onboarding-current-calories')?.value
                };
                break;
        }
    }

    async completeOnboarding() {
        this.saveCurrentStepData();
        
        try {
            // Save user profile to localStorage
            const userProfile = {
                ...this.userData.profile,
                experience_level: this.userData.preferences.experience_level,
                workout_frequency: parseInt(this.userData.preferences.workout_frequency) || 3,
                workout_duration: parseInt(this.userData.preferences.workout_duration) || 60,
                created_at: new Date().toISOString()
            };
            
            localStorage.setItem('user_profile', JSON.stringify(userProfile));
            localStorage.setItem('onboarding_completed', 'true');
            
            // Calculate target calories based on goals and current intake
            const currentCalories = parseInt(this.userData.dietary.current_calories) || 2000;
            const goal = this.userData.goals.primary_goal;
            let targetCalories = currentCalories;
            
            // AI-based calorie recommendations based on goals
            if (goal === 'weight_loss') {
                targetCalories = Math.max(currentCalories - 300, 1200); // 300 cal deficit, min 1200
            } else if (goal === 'muscle_gain') {
                targetCalories = currentCalories + 200; // 200 cal surplus
            } else if (goal === 'endurance') {
                targetCalories = currentCalories + 100; // Slight surplus for endurance
            }
            // For general_fitness, keep current calories
            
            // Save trainer config with AI-suggested target calories
            const trainerConfig = {
                workout_split: 'full_body',
                days_per_week: parseInt(this.userData.preferences.workout_frequency) || 3,
                intensity_level: this.userData.preferences.experience_level || 'intermediate',
                rest_between_sets: '60-90 seconds',
                allowed_equipment: this.userData.equipment.join(', '),
                forbidden_exercises: '',
                target_calories: targetCalories,
                current_calories: currentCalories,
                protein_ratio: 0.3,
                carbs_ratio: 0.4,
                fat_ratio: 0.3,
                dietary_restrictions: this.userData.dietary.restrictions.join(', '),
                cuisine_preferences: this.userData.dietary.preferences.join(', ')
            };
            
            localStorage.setItem('trainerConfig', JSON.stringify(trainerConfig));
            
            // Save nutrition goals with AI-suggested target calories
            const nutritionGoal = {
                goal_type: this.userData.goals.primary_goal,
                target_weight: this.userData.goals.target_weight,
                target_calories: targetCalories, // AI-suggested target calories
                current_calories: currentCalories, // User's current intake
                protein_ratio: 0.3,
                carbs_ratio: 0.4,
                fat_ratio: 0.3,
                dietary_restrictions: this.userData.dietary.restrictions.join(', '),
                is_active: true
            };
            
            localStorage.setItem('nutrition_goal', JSON.stringify(nutritionGoal));
            
            // Attempt to persist profile server-side (if authenticated)
            const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch(_) { return 'America/New_York'; } })();
            const profilePayload = {
                timezone: tz,
                unit_system: (localStorage.getItem('unitSystem') || 'imperial'),
                distance_unit: (localStorage.getItem('distanceUnit') || 'mi'),
                primary_goal: this.userData.goals.primary_goal || 'general_fitness',
                available_equipment: (this.userData.equipment || []).join(', '),
                preferred_workout_time: 'morning',
                workout_frequency: parseInt(this.userData.preferences.workout_frequency) || 3,
                fitness_level: this.userData.preferences.experience_level || 'intermediate',
                age: parseInt(this.userData.profile.age) || null
            };

            try {
                // Use apiFetch with POST for upsert, providing robust error handling
                const response = await api.apiFetch('/api/v1/profile/me/', {
                    method: 'POST', // Use POST for create-or-update (upsert)
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(profilePayload),
                });

                if (response.ok) {
                    const savedProfile = await response.json();
                    console.log('✅ Profile saved to backend:', savedProfile);
                    this.showToast('Profile saved to your account!', 'success');
                } else if (response.status === 401) {
                    console.warn('Authentication needed to save profile.');
                    this.showToast('Profile saved locally. Please sign in to sync.', 'info');
                } else {
                    // Try to parse more detailed error from backend
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error || JSON.stringify(errorData.details) || 'An unknown error occurred.';
                    console.error('❌ Failed to save profile to backend:', response.status, errorMessage);
                    this.showToast(`Error saving profile: ${errorMessage}`, 'error');
                }
            } catch (e) {
                console.error('Network error saving profile:', e);
                this.showToast('Network error: Could not save profile. Saved locally.', 'warning');
            }

            // Show completion message
            this.showCompletionMessage(targetCalories, currentCalories, goal);
            
        } catch (error) {
            console.error('Error completing onboarding:', error);
            this.showToast('There was an error saving your profile. Please try again.', 'error');
        }
    }

    showToast(message, type = 'info') {
        // Fallback toast if the main one isn't available
        if (window.workoutSuggestionsAI && window.workoutSuggestionsAI.showToast) {
            window.workoutSuggestionsAI.showToast(message, type);
        } else {
            // Simple alert as a fallback
            alert(`[${type.toUpperCase()}] ${message}`);
        }
    }

    showCompletionMessage(targetCalories = 2000, currentCalories = 2000, goal = 'general_fitness') {
        const content = document.getElementById('onboarding-content');
        if (content) {
            content.innerHTML = `
                <div style="text-align:center; padding:2rem 0;">
                    <div style="font-size:4rem; margin-bottom:1rem;">🎉</div>
                    <h3 style="margin:0 0 1rem 0; font-size:1.5rem; color:#10b981;">Setup Complete!</h3>
                    <p style="margin:0 0 2rem 0; color:#9ca3af; line-height:1.6; font-size:1.1rem;">
                        Your personalized fitness profile has been created. We're now ready to generate 
                        custom workout plans and meal suggestions just for you!
                    </p>
                    
                    <div style="background:#1e293b; padding:1.5rem; border-radius:12px; margin:2rem 0; text-align:left;">
                        <h4 style="margin:0 0 1rem 0; color:#e5e7eb;">Your AI-Powered Plan:</h4>
                        <ul style="margin:0; padding-left:1.5rem; color:#9ca3af;">
                            <li><strong>Target Calories:</strong> ${targetCalories} cal/day (AI-suggested based on your ${goal.replace('_', ' ')} goal)</li>
                            <li><strong>Current Intake:</strong> ${currentCalories} cal/day</li>
                            <li>Generate your first AI-powered workout suggestions</li>
                            <li>Create a personalized 7-day fitness schedule</li>
                            <li>Get custom meal plans based on your dietary preferences</li>
                            <li>Track your progress with detailed analytics</li>
                        </ul>
                    </div>
                    
                    <button onclick="onboardingFlow.finishOnboarding()" style="background:linear-gradient(135deg,#10b981,#059669); color:white; border:none; padding:1rem 2rem; border-radius:12px; cursor:pointer; font-weight:700; font-size:1.1rem; margin-top:1rem;">
                        Start My Fitness Journey! 🚀
                    </button>
                </div>
            `;
        }
        
        // Hide navigation buttons
        const backBtn = document.getElementById('onboarding-back');
        const nextBtn = document.getElementById('onboarding-next');
        if (backBtn) backBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }

    finishOnboarding() {
        this.hideOnboarding();
        
        // Show success toast
        if (window.workoutSuggestionsAI && window.workoutSuggestionsAI.showToast) {
            window.workoutSuggestionsAI.showToast('Welcome to Maverick Aim Rush! Your profile is ready. 🎉', 'success');
        }
        
        // Refresh the page to load new data
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

// Initialize onboarding flow
window.onboardingFlow = new OnboardingFlow();
