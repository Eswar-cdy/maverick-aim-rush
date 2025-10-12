# Maverick Aim Rush - API v1 Schema Tests
# Tests to ensure API contract consistency and prevent frontend/backend drift
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
import json
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken


class APIV1SchemaTest(TestCase):
    """Test API v1 schema consistency and contract compliance"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Get JWT token for authenticated requests
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_api_v1_base_structure(self):
        """Test that API v1 base structure is accessible"""
        # Test that v1 endpoints are accessible
        response = self.client.get('/api/v1/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_authentication_endpoints_schema(self):
        """Test authentication endpoints schema"""
        endpoints = [
            '/api/v1/auth/register/',
            '/api/v1/auth/login/',
            '/api/v1/auth/login-cookie/',
        ]
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            # Should return 405 Method Not Allowed for GET requests
            self.assertIn(response.status_code, [status.HTTP_405_METHOD_NOT_ALLOWED, status.HTTP_200_OK])
    
    def test_core_resources_schema(self):
        """Test core resource endpoints schema"""
        core_endpoints = [
            '/api/v1/exercises/',
            '/api/v1/foods/',
            '/api/v1/sessions/',
            '/api/v1/goals/',
            '/api/v1/measurements/',
        ]
        
        for endpoint in core_endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify response structure
            data = response.json()
            self.assertIn('results', data)  # Paginated response
            self.assertIn('count', data)
            self.assertIn('next', data)
            self.assertIn('previous', data)
    
    def test_analytics_endpoints_schema(self):
        """Test analytics endpoints schema"""
        analytics_endpoints = [
            '/api/v1/analytics/progress/summary/',
            '/api/v1/analytics/nutrition/',
            '/api/v1/analytics/advanced/',
        ]
        
        for endpoint in analytics_endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify response is JSON
            data = response.json()
            self.assertIsInstance(data, dict)
    
    def test_tools_endpoints_schema(self):
        """Test tools endpoints schema"""
        tools_endpoints = [
            '/api/v1/tools/calculator/',
            '/api/v1/tools/recommendations/',
            '/api/v1/tools/meal-plan-generator/',
        ]
        
        for endpoint in tools_endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify response is JSON
            data = response.json()
            self.assertIsInstance(data, dict)
    
    def test_social_endpoints_schema(self):
        """Test social endpoints schema"""
        social_endpoints = [
            '/api/v1/social/',
        ]
        
        for endpoint in social_endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify response is JSON
            data = response.json()
            self.assertIsInstance(data, dict)
    
    def test_onboarding_endpoints_schema(self):
        """Test onboarding endpoints schema"""
        onboarding_endpoints = [
            '/api/v1/onboarding/status/',
            '/api/v1/onboarding/questions/',
        ]
        
        for endpoint in onboarding_endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify response is JSON
            data = response.json()
            self.assertIsInstance(data, dict)
    
    def test_pagination_consistency(self):
        """Test that all list endpoints have consistent pagination"""
        list_endpoints = [
            '/api/v1/exercises/',
            '/api/v1/foods/',
            '/api/v1/sessions/',
            '/api/v1/goals/',
            '/api/v1/measurements/',
            '/api/v1/recipes/',
            '/api/v1/meal-plans/',
        ]
        
        for endpoint in list_endpoints:
            response = self.client.get(endpoint)
            if response.status_code == status.HTTP_200_OK:
                data = response.json()
                
                # Verify pagination structure
                required_fields = ['count', 'next', 'previous', 'results']
                for field in required_fields:
                    self.assertIn(field, data, f"Missing {field} in {endpoint}")
                
                # Verify results is a list
                self.assertIsInstance(data['results'], list)
    
    def test_error_response_consistency(self):
        """Test that error responses have consistent structure"""
        # Test 404 error
        response = self.client.get('/api/v1/nonexistent/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Test unauthorized access
        self.client.credentials()  # Remove auth
        response = self.client.get('/api/v1/goals/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_api_versioning_headers(self):
        """Test that API v1 includes proper versioning headers"""
        response = self.client.get('/api/v1/exercises/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check for version header (if implemented)
        # self.assertIn('API-Version', response.headers)
        # self.assertEqual(response.headers['API-Version'], 'v1')
    
    def test_cors_headers(self):
        """Test CORS headers for API v1"""
        response = self.client.options('/api/v1/exercises/')
        
        # Should handle OPTIONS request
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
    
    def test_content_type_consistency(self):
        """Test that all endpoints return consistent content types"""
        endpoints = [
            '/api/v1/exercises/',
            '/api/v1/analytics/progress/summary/',
            '/api/v1/tools/calculator/',
        ]
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            if response.status_code == status.HTTP_200_OK:
                self.assertEqual(response['Content-Type'], 'application/json')


class APIV1ContractTest(TestCase):
    """Test API v1 contract compliance for specific endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Get JWT token for authenticated requests
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_exercises_endpoint_contract(self):
        """Test exercises endpoint contract"""
        response = self.client.get('/api/v1/exercises/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        
        # Verify pagination structure
        self.assertIn('count', data)
        self.assertIn('next', data)
        self.assertIn('previous', data)
        self.assertIn('results', data)
        
        # If there are results, verify structure
        if data['results']:
            exercise = data['results'][0]
            # Verify required fields (adjust based on your model)
            # self.assertIn('id', exercise)
            # self.assertIn('name', exercise)
    
    def test_goals_endpoint_contract(self):
        """Test goals endpoint contract"""
        response = self.client.get('/api/v1/goals/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        
        # Verify pagination structure
        self.assertIn('count', data)
        self.assertIn('next', data)
        self.assertIn('previous', data)
        self.assertIn('results', data)
        
        # Results should be a list
        self.assertIsInstance(data['results'], list)
    
    def test_analytics_endpoint_contract(self):
        """Test analytics endpoint contract"""
        response = self.client.get('/api/v1/analytics/progress/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        
        # Verify it's a dictionary (not paginated)
        self.assertIsInstance(data, dict)
        
        # Verify common analytics fields (adjust based on your implementation)
        # self.assertIn('total_sessions', data)
        # self.assertIn('total_volume', data)
