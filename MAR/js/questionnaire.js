document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:8000/api/tracker';
    const form = document.getElementById('questionnaire-form');
    const steps = Array.from(form.querySelectorAll('.form-step'));
    const statusDiv = document.getElementById('generation-status');
    let currentStep = 0;

    const showStep = (stepIndex) => {
        steps.forEach((step, index) => {
            step.classList.toggle('active-step', index === stepIndex);
        });
    };

    form.addEventListener('click', (e) => {
        if (e.target.matches('.next-step')) {
            if (currentStep < steps.length - 1) {
                currentStep++;
                showStep(currentStep);
            }
        } else if (e.target.matches('.prev-step')) {
            if (currentStep > 0) {
                currentStep--;
                showStep(currentStep);
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        statusDiv.textContent = 'Saving your preferences...';
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            statusDiv.textContent = 'You are not logged in. Please log in again.';
            window.location.href = '/index.html';
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        if (data.days_per_week !== undefined) data.days_per_week = parseInt(data.days_per_week, 10);

        try {
            // Save profile
            const profileResponse = await fetch(`${API_URL}/profile/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!profileResponse.ok) {
                let message = 'Failed to save profile.';
                try {
                    const err = await profileResponse.json();
                    if (typeof err === 'object') {
                        message = Object.entries(err).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' | ');
                    }
                } catch(_){}
                statusDiv.textContent = `Error: ${message}`;
                return;
            }

            // Generate program via new endpoint
            statusDiv.textContent = 'Generating your personalized plan...';
            const genResp = await fetch(`${API_URL}/program/generate/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!genResp.ok) {
                statusDiv.textContent = 'Error: Failed to generate program.';
                return;
            }

            statusDiv.textContent = 'Plan generated successfully! Redirecting...';
            setTimeout(() => { window.location.href = '/index.html'; }, 1200);
        } catch (error) {
            statusDiv.textContent = `Error: ${error.message}`;
        }
    });

    showStep(currentStep);
});
