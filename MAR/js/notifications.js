// Notification Management System for Maverick Aim Rush
class NotificationManager {
  constructor() {
    this.permission = null;
    this.subscription = null;
    this.db = null;
    this.init();
  }

  async init() {
    await this.initDatabase();
    await this.checkPermission();
    await this.setupNotificationPreferences();
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MaverickNotifications', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('notifications')) {
          const store = db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
          store.createIndex('scheduledTime', 'scheduledTime', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (this.permission === 'granted') {
      return true;
    }

    this.permission = await Notification.requestPermission();
    return this.permission === 'granted';
  }

  async setupNotificationPreferences() {
    const preferences = this.getNotificationPreferences();
    if (preferences.enabled) {
      await this.scheduleDefaultNotifications();
    }
  }

  getNotificationPreferences() {
    const defaultPrefs = {
      enabled: true,
      workoutReminders: true,
      mealReminders: true,
      progressUpdates: true,
      achievementAlerts: true,
      workoutTime: '18:00',
      mealTimes: ['08:00', '12:00', '18:00'],
      quietHours: { start: '22:00', end: '07:00' }
    };

    const stored = localStorage.getItem('notificationPreferences');
    return stored ? { ...defaultPrefs, ...JSON.parse(stored) } : defaultPrefs;
  }

  saveNotificationPreferences(preferences) {
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
  }

  async scheduleDefaultNotifications() {
    const prefs = this.getNotificationPreferences();
    
    if (prefs.workoutReminders) {
      await this.scheduleWorkoutReminder();
    }
    
    if (prefs.mealReminders) {
      await this.scheduleMealReminders();
    }
  }

  async scheduleWorkoutReminder() {
    const prefs = this.getNotificationPreferences();
    const [hours, minutes] = prefs.workoutTime.split(':');
    
    const scheduledTime = new Date();
    scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= new Date()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    await this.scheduleNotification({
      title: '💪 Time for Your Workout!',
      body: 'Your scheduled workout time is here. Let\'s crush those goals!',
      scheduledTime: scheduledTime.toISOString(),
      type: 'workout_reminder',
      data: { url: '/calculator.html' },
      recurring: true
    });
  }

  async scheduleMealReminders() {
    const prefs = this.getNotificationPreferences();
    
    for (const mealTime of prefs.mealTimes) {
      const [hours, minutes] = mealTime.split(':');
      
      const scheduledTime = new Date();
      scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      if (scheduledTime <= new Date()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const mealType = this.getMealType(mealTime);
      
      await this.scheduleNotification({
        title: `🍽️ ${mealType} Time!`,
        body: 'Don\'t forget to log your meal and stay on track with your nutrition goals.',
        scheduledTime: scheduledTime.toISOString(),
        type: 'meal_reminder',
        data: { url: '/recommendations.html' },
        recurring: true
      });
    }
  }

  getMealType(time) {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 11) return 'Breakfast';
    if (hour < 15) return 'Lunch';
    return 'Dinner';
  }

  async scheduleNotification(notification) {
    if (!this.db) await this.initDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      // Use put() instead of add() to avoid constraint errors
      const request = store.put(notification);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async showImmediateNotification(title, body, options = {}) {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return false;
    }

    const notification = new Notification(title, {
      body,
      icon: '/images/favicon.png',
      badge: '/images/favicon.png',
      tag: 'maverick-fitness',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  }

  async showAchievementNotification(achievement) {
    await this.showImmediateNotification(
      '🏆 Achievement Unlocked!',
      `Congratulations! You've earned: ${achievement.title}`,
      { data: { url: '/social.html' } }
    );
  }

  async showProgressNotification(progress) {
    await this.showImmediateNotification(
      '📈 Progress Update',
      `Great job! ${progress.message}`,
      { data: { url: '/calculator.html' } }
    );
  }
}

// Initialize notification manager
window.notificationManager = new NotificationManager();
