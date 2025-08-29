document.addEventListener('DOMContentLoaded', () => {
    const authModal = document.getElementById('auth-modal');
    const mainContent = document.querySelector('.main');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    const API_URL = 'http://127.0.0.1:8000/api/users'; // Correct base URL for user auth

    function connectWebSocket() {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) return;

        // Append the token as a query parameter
        const wsUrl = `ws://127.0.0.1:8000/ws/notifications/?token=${accessToken}`;
        
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log("WebSocket connection established.");
            // We could send an initial message if needed, e.g., with the auth token
            // socket.send(JSON.stringify({ token: accessToken }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Received notification:", data);
            // Here, you could trigger a UI update, like showing a toast notification
            alert(`New Notification: ${data.message}`);
        };

        socket.onclose = () => {
            console.log("WebSocket connection closed. Attempting to reconnect...");
            // Simple reconnect logic
            setTimeout(connectWebSocket, 5000); 
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    }

    // Check for existing tokens and connect WebSocket if logged in
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        authModal.style.display = 'none';
        mainContent.style.display = 'block';
        connectWebSocket(); // Establish WebSocket connection
    } else {
        authModal.style.display = 'block';
        mainContent.style.display = 'none';
    }

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_URL}/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed');
            }

            const tokens = await response.json();
            localStorage.setItem('accessToken', tokens.access);
            localStorage.setItem('refreshToken', tokens.refresh);

            authModal.style.display = 'none';
            mainContent.style.display = 'block';
            
            // Connect WebSocket on successful login
            connectWebSocket();

            // Reload to update dashboard etc.
            // window.location.reload(); // We might remove this to keep the socket connection stable
        } catch (error) {
            loginError.textContent = error.message;
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = registerForm.username.value;
        const email = registerForm.email.value;
        const password = registerForm.password.value;
        const password2 = registerForm.password2.value;

        try {
            const response = await fetch(`${API_URL}/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, password2 })
            });

            if (response.ok) {
                // Registration successful, now automatically log them in
                try {
                    const loginResponse = await fetch(`${API_URL}/token/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });

                    if (loginResponse.ok) {
                        const data = await loginResponse.json();
                        localStorage.setItem('accessToken', data.access);
                        localStorage.setItem('refreshToken', data.refresh);
                        // Redirect to the questionnaire
                        window.location.href = '/questionnaire.html';
                    } else {
                        throw new Error('Auto-login failed after registration.');
                    }
                } catch (error) {
                    registerError.textContent = 'Registration successful, but auto-login failed. Please log in manually.';
                    showForm('login');
                }
            } else {
                const errorData = await response.json();
                // Display a more user-friendly error
                let errorMessage = 'Registration failed.';
                if (errorData.username) {
                    errorMessage = `Username: ${errorData.username.join(' ')}`;
                } else if (errorData.email) {
                    errorMessage = `Email: ${errorData.email.join(' ')}`;
                } else if (errorData.password) {
                    errorMessage = `Password: ${errorData.password.join(' ')}`;
                }
                registerError.textContent = errorMessage;
            }
        } catch (error) {
            registerError.textContent = 'An error occurred. Please try again.';
        }
    });
});
