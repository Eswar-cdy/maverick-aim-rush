// Smart Notification Scheduler
class SmartNotificationScheduler {
  constructor() {
    this.userBehavior = this.loadUserBehavior();
    this.init();
  }

  init() {
    this.trackUserActivity();
    this.scheduleSmartNotifications();
  }

  loadUserBehavior() {
    const defaultBehavior = {
      workoutTimes: [],
      mealTimes: [],
      activeHours: { start: 8, end: 22 },
      lastActivity: null,
      notificationResponses: [],
      preferences: {
        workoutFrequency: 3, // days per week
        mealFrequency: 3, // meals per day
        preferredWorkoutTime: 18,
        preferredMealTimes: [8, 12, 18]
      }
    };

    const stored = localStorage.getItem('userBehavior');
    return stored ? { ...defaultBehavior, ...JSON.parse(stored) } : defaultBehavior;
  }

  saveUserBehavior() {
    localStorage.setItem('userBehavior', JSON.stringify(this.userBehavior));
  }

  trackUserActivity() {
    // Track workout logging times
    this.trackWorkoutActivity();
    
    // Track meal logging times
    this.trackMealActivity();
    
    // Track general app usage
    this.trackAppUsage();
  }

  trackWorkoutActivity() {
    // Listen for workout completion events
    document.addEventListener('workoutCompleted', (event) => {
      const workoutTime = new Date();
      this.userBehavior.workoutTimes.push(workoutTime.toISOString());
      
      // Keep only last 30 workout times
      if (this.userBehavior.workoutTimes.length > 30) {
        this.userBehavior.workoutTimes = this.userBehavior.workoutTimes.slice(-30);
      }
      
      this.saveUserBehavior();
      this.updateWorkoutSchedule();
    });
  }

  trackMealActivity() {
    // Listen for meal logging events
    document.addEventListener('mealLogged', (event) => {
      const mealTime = new Date();
      this.userBehavior.mealTimes.push(mealTime.toISOString());
      
      // Keep only last 50 meal times
      if (this.userBehavior.mealTimes.length > 50) {
        this.userBehavior.mealTimes = this.userBehavior.mealTimes.slice(-50);
      }
      
      this.saveUserBehavior();
      this.updateMealSchedule();
    });
  }

  trackAppUsage() {
    // Track when user is most active
    const now = new Date();
    const hour = now.getHours();
    
    if (!this.userBehavior.activeHours.start || hour < this.userBehavior.activeHours.start) {
      this.userBehavior.activeHours.start = hour;
    }
    
    if (!this.userBehavior.activeHours.end || hour > this.userBehavior.activeHours.end) {
      this.userBehavior.activeHours.end = hour;
    }
    
    this.userBehavior.lastActivity = now.toISOString();
    this.saveUserBehavior();
  }

  scheduleSmartNotifications() {
    this.scheduleWorkoutNotifications();
    this.scheduleMealNotifications();
    this.scheduleProgressNotifications();
    this.scheduleMotivationalNotifications();
  }

  scheduleWorkoutNotifications() {
    const optimalTime = this.calculateOptimalWorkoutTime();
    const nextWorkout = this.calculateNextWorkoutDate();
    
    if (nextWorkout) {
      const scheduledTime = new Date(nextWorkout);
      scheduledTime.setHours(optimalTime.hour, optimalTime.minute, 0, 0);
      
      window.notificationManager.scheduleNotification({
        title: '💪 Time for Your Workout!',
        body: this.getWorkoutMotivationMessage(),
        scheduledTime: scheduledTime.toISOString(),
        type: 'smart_workout_reminder',
        data: { url: '/calculator.html' },
        recurring: false
      });
    }
  }

  scheduleMealNotifications() {
    const optimalMealTimes = this.calculateOptimalMealTimes();
    
    optimalMealTimes.forEach((time, index) => {
      const scheduledTime = new Date();
      scheduledTime.setHours(time.hour, time.minute, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (scheduledTime <= new Date()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const mealType = this.getMealType(time.hour);
      
      window.notificationManager.scheduleNotification({
        title: `🍽️ ${mealType} Time!`,
        body: this.getMealMotivationMessage(mealType),
        scheduledTime: scheduledTime.toISOString(),
        type: 'smart_meal_reminder',
        data: { url: '/recommendations.html' },
        recurring: true
      });
    });
  }

  scheduleProgressNotifications() {
    // Schedule weekly progress check-ins
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(19, 0, 0, 0); // 7 PM
    
    window.notificationManager.scheduleNotification({
      title: '📊 Weekly Progress Check',
      body: 'Time to review your fitness progress and celebrate your achievements!',
      scheduledTime: nextWeek.toISOString(),
      type: 'progress_check',
      data: { url: '/calculator.html' },
      recurring: true
    });
  }

  scheduleMotivationalNotifications() {
    // Schedule random motivational messages during active hours
    const activeHours = this.userBehavior.activeHours;
    const randomHour = activeHours.start + Math.floor(Math.random() * (activeHours.end - activeHours.start));
    
    const scheduledTime = new Date();
    scheduledTime.setHours(randomHour, Math.floor(Math.random() * 60), 0, 0);
    
    // Schedule for tomorrow if time has passed
    if (scheduledTime <= new Date()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    window.notificationManager.scheduleNotification({
      title: '🌟 Stay Motivated!',
      body: this.getRandomMotivationalMessage(),
      scheduledTime: scheduledTime.toISOString(),
      type: 'motivational',
      data: { url: '/' },
      recurring: false
    });
  }

  calculateOptimalWorkoutTime() {
    if (this.userBehavior.workoutTimes.length === 0) {
      return { hour: 18, minute: 0 }; // Default 6 PM
    }
    
    // Calculate average workout time
    const workoutHours = this.userBehavior.workoutTimes.map(time => new Date(time).getHours());
    const averageHour = Math.round(workoutHours.reduce((sum, hour) => sum + hour, 0) / workoutHours.length);
    
    return { hour: averageHour, minute: 0 };
  }

  calculateOptimalMealTimes() {
    if (this.userBehavior.mealTimes.length === 0) {
      return [
        { hour: 8, minute: 0 },
        { hour: 12, minute: 0 },
        { hour: 18, minute: 0 }
      ];
    }
    
    // Group meal times by meal type and calculate averages
    const mealGroups = {
      breakfast: [],
      lunch: [],
      dinner: []
    };
    
    this.userBehavior.mealTimes.forEach(time => {
      const hour = new Date(time).getHours();
      if (hour < 11) mealGroups.breakfast.push(hour);
      else if (hour < 15) mealGroups.lunch.push(hour);
      else mealGroups.dinner.push(hour);
    });
    
    const optimalTimes = [];
    
    if (mealGroups.breakfast.length > 0) {
      const avgHour = Math.round(mealGroups.breakfast.reduce((sum, hour) => sum + hour, 0) / mealGroups.breakfast.length);
      optimalTimes.push({ hour: avgHour, minute: 0 });
    }
    
    if (mealGroups.lunch.length > 0) {
      const avgHour = Math.round(mealGroups.lunch.reduce((sum, hour) => sum + hour, 0) / mealGroups.lunch.length);
      optimalTimes.push({ hour: avgHour, minute: 0 });
    }
    
    if (mealGroups.dinner.length > 0) {
      const avgHour = Math.round(mealGroups.dinner.reduce((sum, hour) => sum + hour, 0) / mealGroups.dinner.length);
      optimalTimes.push({ hour: avgHour, minute: 0 });
    }
    
    return optimalTimes.length > 0 ? optimalTimes : [
      { hour: 8, minute: 0 },
      { hour: 12, minute: 0 },
      { hour: 18, minute: 0 }
    ];
  }

  calculateNextWorkoutDate() {
    const lastWorkout = this.userBehavior.workoutTimes[this.userBehavior.workoutTimes.length - 1];
    if (!lastWorkout) return new Date(); // Start today if no previous workouts
    
    const daysSinceLastWorkout = Math.floor((new Date() - new Date(lastWorkout)) / (1000 * 60 * 60 * 24));
    const targetFrequency = this.userBehavior.preferences.workoutFrequency;
    const daysBetweenWorkouts = Math.floor(7 / targetFrequency);
    
    if (daysSinceLastWorkout >= daysBetweenWorkouts) {
      return new Date(); // Time for a workout
    }
    
    const nextWorkout = new Date(lastWorkout);
    nextWorkout.setDate(nextWorkout.getDate() + daysBetweenWorkouts);
    return nextWorkout;
  }

  getMealType(hour) {
    if (hour < 11) return 'Breakfast';
    if (hour < 15) return 'Lunch';
    return 'Dinner';
  }

  getWorkoutMotivationMessage() {
    const messages = [
      'Your workout is calling! Time to show your muscles who\'s boss! 💪',
      'Ready to crush those fitness goals? Let\'s do this! 🔥',
      'Your body will thank you for this workout. Let\'s go! ⚡',
      'Time to turn up the intensity! Your workout awaits! 🏋️‍♂️',
      'Every workout brings you closer to your goals. Let\'s make it count! 🎯'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  getMealMotivationMessage(mealType) {
    const messages = {
      breakfast: [
        'Start your day right with a nutritious breakfast! 🌅',
        'Fuel your morning with a healthy breakfast! ☀️',
        'Breakfast is the most important meal. Make it count! 🥞'
      ],
      lunch: [
        'Time for a healthy lunch to power through your day! 🥗',
        'Refuel with a nutritious lunch! 🍽️',
        'Your body needs good fuel for the afternoon! ⚡'
      ],
      dinner: [
        'End your day with a balanced dinner! 🌙',
        'Time to wind down with a healthy dinner! 🍽️',
        'Nourish your body with a nutritious dinner! 🌟'
      ]
    };
    
    const mealMessages = messages[mealType.toLowerCase()] || messages.dinner;
    return mealMessages[Math.floor(Math.random() * mealMessages.length)];
  }

  getRandomMotivationalMessage() {
    const messages = [
      'You\'re stronger than you think! Keep pushing forward! 💪',
      'Every small step counts towards your big goals! 🎯',
      'Your future self will thank you for today\'s efforts! 🌟',
      'Consistency is the key to success. You\'ve got this! 🔑',
      'Believe in yourself and watch the magic happen! ✨',
      'Progress, not perfection. Keep moving forward! 🚀',
      'Your dedication is inspiring. Keep up the great work! 👏',
      'Every challenge is an opportunity to grow stronger! 🌱'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  updateWorkoutSchedule() {
    // Recalculate and update workout notifications
    this.scheduleWorkoutNotifications();
  }

  updateMealSchedule() {
    // Recalculate and update meal notifications
    this.scheduleMealNotifications();
  }

  // Public methods for external triggers
  triggerWorkoutCompleted() {
    document.dispatchEvent(new CustomEvent('workoutCompleted'));
  }

  triggerMealLogged() {
    document.dispatchEvent(new CustomEvent('mealLogged'));
  }

  triggerAchievementUnlocked(achievement) {
    window.notificationManager.showAchievementNotification(achievement);
  }

  triggerProgressMilestone(milestone) {
    window.notificationManager.showProgressNotification(milestone);
  }
}

// Initialize smart notification scheduler
window.smartScheduler = new SmartNotificationScheduler();
