// Notification UI Management
class NotificationUI {
  constructor() {
    this.createNotificationSettings();
    this.setupEventListeners();
  }

  createNotificationSettings() {
    const settingsHTML = `
      <div id="notification-settings" class="notification-settings" style="display: none;">
        <div class="notification-settings__overlay"></div>
        <div class="notification-settings__modal">
          <div class="notification-settings__header">
            <h2>🔔 Notification Settings</h2>
            <button id="close-notification-settings" class="notification-settings__close">×</button>
          </div>
          <div class="notification-settings__body">
            <div class="notification-settings__section">
              <h3>General Settings</h3>
              <div class="notification-settings__toggle">
                <label>
                  <input type="checkbox" id="notifications-enabled" checked>
                  Enable Notifications
                </label>
              </div>
            </div>
            
            <div class="notification-settings__section">
              <h3>Workout Reminders</h3>
              <div class="notification-settings__toggle">
                <label>
                  <input type="checkbox" id="workout-reminders" checked>
                  Workout Reminders
                </label>
              </div>
              <div class="notification-settings__time">
                <label for="workout-time">Workout Time:</label>
                <input type="time" id="workout-time" value="18:00">
              </div>
            </div>
            
            <div class="notification-settings__section">
              <h3>Meal Reminders</h3>
              <div class="notification-settings__toggle">
                <label>
                  <input type="checkbox" id="meal-reminders" checked>
                  Meal Reminders
                </label>
              </div>
              <div class="notification-settings__times">
                <label>Meal Times:</label>
                <div class="meal-times">
                  <input type="time" class="meal-time" value="08:00" placeholder="Breakfast">
                  <input type="time" class="meal-time" value="12:00" placeholder="Lunch">
                  <input type="time" class="meal-time" value="18:00" placeholder="Dinner">
                </div>
              </div>
            </div>
            
            <div class="notification-settings__section">
              <h3>Progress Updates</h3>
              <div class="notification-settings__toggle">
                <label>
                  <input type="checkbox" id="progress-updates" checked>
                  Progress Updates
                </label>
              </div>
              <div class="notification-settings__toggle">
                <label>
                  <input type="checkbox" id="achievement-alerts" checked>
                  Achievement Alerts
                </label>
              </div>
            </div>
            
            <div class="notification-settings__section">
              <h3>Quiet Hours</h3>
              <div class="notification-settings__quiet-hours">
                <label for="quiet-start">Start:</label>
                <input type="time" id="quiet-start" value="22:00">
                <label for="quiet-end">End:</label>
                <input type="time" id="quiet-end" value="07:00">
              </div>
            </div>
            
            <div class="notification-settings__actions">
              <button id="test-notification" class="button button--secondary">Test Notification</button>
              <button id="save-notification-settings" class="button button--primary">Save Settings</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', settingsHTML);
    this.addNotificationStyles();
  }

  addNotificationStyles() {
    const styles = `
      <style>
        .notification-settings {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
        }
        
        .notification-settings__overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(5px);
        }
        
        .notification-settings__modal {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 15px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .notification-settings__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
        }
        
        .notification-settings__close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }
        
        .notification-settings__body {
          padding: 1.5rem;
        }
        
        .notification-settings__section {
          margin-bottom: 2rem;
        }
        
        .notification-settings__section h3 {
          margin-bottom: 1rem;
          color: #333;
          font-family: 'Righteous', cursive;
        }
        
        .notification-settings__toggle label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
        }
        
        .notification-settings__time,
        .notification-settings__times {
          margin-top: 1rem;
        }
        
        .notification-settings__time input,
        .notification-settings__times input {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 5px;
          margin-left: 0.5rem;
        }
        
        .meal-times {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .meal-times input {
          flex: 1;
          min-width: 100px;
        }
        
        .notification-settings__quiet-hours {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .notification-settings__actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }
        
        @media (max-width: 768px) {
          .notification-settings__modal {
            width: 95%;
            margin: 1rem;
          }
          
          .notification-settings__actions {
            flex-direction: column;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  setupEventListeners() {
    // Close modal
    document.getElementById('close-notification-settings').addEventListener('click', () => {
      this.hideSettings();
    });

    // Overlay click to close
    document.querySelector('.notification-settings__overlay').addEventListener('click', () => {
      this.hideSettings();
    });

    // Test notification
    document.getElementById('test-notification').addEventListener('click', () => {
      this.testNotification();
    });

    // Save settings
    document.getElementById('save-notification-settings').addEventListener('click', () => {
      this.saveSettings();
    });

    // Load current settings
    this.loadSettings();
  }

  showSettings() {
    document.getElementById('notification-settings').style.display = 'block';
    this.loadSettings();
  }

  hideSettings() {
    document.getElementById('notification-settings').style.display = 'none';
  }

  loadSettings() {
    const prefs = window.notificationManager.getNotificationPreferences();
    
    document.getElementById('notifications-enabled').checked = prefs.enabled;
    document.getElementById('workout-reminders').checked = prefs.workoutReminders;
    document.getElementById('meal-reminders').checked = prefs.mealReminders;
    document.getElementById('progress-updates').checked = prefs.progressUpdates;
    document.getElementById('achievement-alerts').checked = prefs.achievementAlerts;
    document.getElementById('workout-time').value = prefs.workoutTime;
    document.getElementById('quiet-start').value = prefs.quietHours.start;
    document.getElementById('quiet-end').value = prefs.quietHours.end;
    
    const mealTimeInputs = document.querySelectorAll('.meal-time');
    mealTimeInputs.forEach((input, index) => {
      input.value = prefs.mealTimes[index] || '';
    });
  }

  async saveSettings() {
    const preferences = {
      enabled: document.getElementById('notifications-enabled').checked,
      workoutReminders: document.getElementById('workout-reminders').checked,
      mealReminders: document.getElementById('meal-reminders').checked,
      progressUpdates: document.getElementById('progress-updates').checked,
      achievementAlerts: document.getElementById('achievement-alerts').checked,
      workoutTime: document.getElementById('workout-time').value,
      mealTimes: Array.from(document.querySelectorAll('.meal-time')).map(input => input.value),
      quietHours: {
        start: document.getElementById('quiet-start').value,
        end: document.getElementById('quiet-end').value
      }
    };

    window.notificationManager.saveNotificationPreferences(preferences);
    
    if (preferences.enabled) {
      await window.notificationManager.requestPermission();
      await window.notificationManager.scheduleDefaultNotifications();
    }

    this.hideSettings();
    this.showSuccessMessage('Notification settings saved!');
  }

  async testNotification() {
    const success = await window.notificationManager.showImmediateNotification(
      '🔔 Test Notification',
      'This is a test notification from Maverick Aim Rush!',
      { data: { url: '/' } }
    );

    if (!success) {
      this.showErrorMessage('Please enable notifications in your browser settings.');
    }
  }

  showSuccessMessage(message) {
    this.showToast(message, 'success');
  }

  showErrorMessage(message) {
    this.showToast(message, 'error');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 5px;
      z-index: 10001;
      font-family: 'Righteous', cursive;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialize notification UI
window.notificationUI = new NotificationUI();
