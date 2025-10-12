# API tests for Maverick Aim Rush
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from .models import WorkoutSession, NutritionLog


class NutritionLogAPITests(APITestCase):
    """Test nutrition logging API functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_nutrition_log_creation(self):
        """Test creating a nutrition log entry via API"""
        url = reverse('nutritionlog-list')
        data = {
            'food_name': 'Chicken Breast',
            'calories': 200,
            'protein': 30,
            'carbs': 0,
            'fat': 10,
            'meal_type': 'lunch',
            'date': '2024-01-15'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify the entry was created
        nutrition_log = NutritionLog.objects.get(user=self.user)
        self.assertEqual(nutrition_log.food_name, 'Chicken Breast')
        self.assertEqual(nutrition_log.calories, 200)
    
    def test_nutrition_log_list(self):
        """Test retrieving nutrition logs via API"""
        # Create some test data
        NutritionLog.objects.create(
            user=self.user,
            food_name='Apple',
            calories=80,
            protein=0,
            carbs=20,
            fat=0,
            meal_type='snack'
        )
        
        url = reverse('nutritionlog-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class CalculatorAPITests(APITestCase):
    """Test fitness calculator API functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_bmi_calculation(self):
        """Test BMI calculation via API"""
        url = reverse('calculator')
        data = {
            'calculation_type': 'bmi',
            'height': 70,  # inches
            'weight': 150  # pounds
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # BMI should be approximately 21.5
        self.assertIn('result', response.data)
        self.assertGreater(response.data['result'], 20)
        self.assertLess(response.data['result'], 25)
    
    def test_bmr_calculation(self):
        """Test BMR calculation via API"""
        url = reverse('calculator')
        data = {
            'calculation_type': 'bmr',
            'height': 70,
            'weight': 150,
            'age': 25,
            'gender': 'male'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # BMR should be reasonable for a 25-year-old male
        self.assertIn('result', response.data)
        self.assertGreater(response.data['result'], 1500)
        self.assertLess(response.data['result'], 2000)


class ErrorHandlingTests(APITestCase):
    """Test error handling and edge cases"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_invalid_calculator_input(self):
        """Test calculator with invalid input"""
        url = reverse('calculator')
        data = {
            'calculation_type': 'bmi',
            'height': -5,  # Invalid negative height
            'weight': 0    # Invalid zero weight
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_missing_required_fields(self):
        """Test API with missing required fields"""
        url = reverse('nutritionlog-list')
        data = {
            'food_name': 'Test Food'
            # Missing required fields like calories, protein, etc.
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_nonexistent_endpoint(self):
        """Test accessing non-existent endpoint"""
        response = self.client.get('/api/nonexistent/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
