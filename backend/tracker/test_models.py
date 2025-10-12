# Model tests for Maverick Aim Rush
from django.test import TestCase
from django.contrib.auth.models import User
from .models import WorkoutSession, NutritionLog, UserProfile, ProgressAnalytics


class WorkoutModelTests(TestCase):
    """Test Workout model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_workout_creation(self):
        """Test creating a workout session"""
        workout = WorkoutSession.objects.create(
            user=self.user,
            name='Test Workout',
            duration_minutes=60,
            calories_burned=300,
            notes='Great workout!'
        )
        
        self.assertEqual(workout.user, self.user)
        self.assertEqual(workout.name, 'Test Workout')
        self.assertEqual(workout.duration_minutes, 60)
        self.assertTrue(workout.created_at)
    
    def test_workout_str_representation(self):
        """Test workout string representation"""
        workout = WorkoutSession.objects.create(
            user=self.user,
            name='Test Workout',
            duration_minutes=60
        )
        
        self.assertEqual(str(workout), 'Test Workout')


class NutritionLogTests(TestCase):
    """Test nutrition logging functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_nutrition_log_creation(self):
        """Test creating a nutrition log entry"""
        nutrition_log = NutritionLog.objects.create(
            user=self.user,
            food_name='Chicken Breast',
            calories=200,
            protein=30,
            carbs=0,
            fat=10,
            meal_type='lunch'
        )
        
        self.assertEqual(nutrition_log.user, self.user)
        self.assertEqual(nutrition_log.food_name, 'Chicken Breast')
        self.assertEqual(nutrition_log.calories, 200)
        self.assertEqual(nutrition_log.protein, 30)


class UserProfileTests(TestCase):
    """Test UserProfile model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_user_profile_creation(self):
        """Test creating a user profile"""
        profile = UserProfile.objects.create(
            user=self.user,
            height=70,
            weight=150,
            age=25,
            gender='male',
            activity_level='moderate',
            fitness_goals='weight_loss',
            preferred_units='imperial'
        )
        
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.height, 70)
        self.assertEqual(profile.weight, 150)
        self.assertEqual(profile.preferred_units, 'imperial')
    
    def test_user_profile_one_to_one_relationship(self):
        """Test one-to-one relationship with User"""
        profile = UserProfile.objects.create(
            user=self.user,
            height=70,
            weight=150
        )
        
        # Test accessing profile from user
        self.assertEqual(self.user.tracker_profile, profile)
        
        # Test accessing user from profile
        self.assertEqual(profile.user, self.user)
