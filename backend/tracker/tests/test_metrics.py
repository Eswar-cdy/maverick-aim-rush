"""
Unit tests for fitness metrics calculations
"""
from django.test import TestCase
from tracker.metrics import epley_e1rm, coarse_trimp


class MetricsTest(TestCase):
    """Test fitness metrics calculations"""
    
    def test_epley_e1rm(self):
        """Test Epley e1RM calculation"""
        # Test cases: (weight, reps, expected_e1rm)
        test_cases = [
            (100, 1, 103.33),  # 1RM: 100 * (1 + 1/30) = 100 * 1.0333 = 103.33
            (100, 5, 116.67),  # 5 reps: 100 * (1 + 5/30) = 100 * 1.1667 = 116.67
            (100, 10, 133.33),  # 10 reps: 100 * (1 + 10/30) = 100 * 1.3333 = 133.33
            (80, 8, 101.33),  # 8 reps: 80 * (1 + 8/30) = 80 * 1.2667 = 101.33
            (0, 5, 0.0),  # Zero weight
            (100, 0, 100.0),  # Zero reps (should return weight)
        ]
        
        for weight, reps, expected in test_cases:
            with self.subTest(weight=weight, reps=reps):
                result = epley_e1rm(weight, reps)
                self.assertAlmostEqual(result, expected, places=2)
    
    def test_epley_e1rm_edge_cases(self):
        """Test Epley e1RM edge cases"""
        # Negative values should be handled gracefully
        self.assertEqual(epley_e1rm(-10, 5), 0.0)
        self.assertEqual(epley_e1rm(100, -5), 100.0)
        
        # Very high reps
        result = epley_e1rm(100, 50)
        self.assertGreater(result, 100)
        self.assertLess(result, 300)  # Reasonable upper bound
    
    def test_coarse_trimp(self):
        """Test coarse TRIMP calculation"""
        # Test cases: (heart_rate, age, expected_trimp)
        test_cases = [
            (120, 30, 2),  # Low HR zone
            (150, 30, 3),  # Moderate HR zone
            (170, 30, 4),  # High HR zone
            (190, 30, 5),  # Very high HR zone
            (200, 30, 5),  # Maximum HR zone
            (100, 25, 1),  # Different age
            (180, 40, 5),  # Different age
        ]
        
        for hr, age, expected in test_cases:
            with self.subTest(hr=hr, age=age):
                result = coarse_trimp(hr, age)
                self.assertEqual(result, expected)
    
    def test_coarse_trimp_edge_cases(self):
        """Test coarse TRIMP edge cases"""
        # Very low HR
        self.assertEqual(coarse_trimp(50, 30), 1)
        
        # Very high HR
        self.assertEqual(coarse_trimp(220, 30), 5)
        
        # Edge age values
        self.assertEqual(coarse_trimp(150, 18), 3)  # Young athlete
        self.assertEqual(coarse_trimp(150, 60), 5)  # Older athlete
        
        # Invalid inputs
        self.assertEqual(coarse_trimp(-10, 30), 1)  # Negative HR
        self.assertEqual(coarse_trimp(150, -10), 1)  # Negative age
