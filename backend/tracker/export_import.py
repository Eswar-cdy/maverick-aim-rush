# Data Export/Import functionality for Maverick Aim Rush
import json
import csv
import io
from datetime import datetime, timedelta
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import (
    WorkoutSession, NutritionLog, ProgressAnalytics,
    PersonalRecord, WorkoutStreak, UserConnection, Challenge,
    ChallengeParticipation, Leaderboard, LeaderboardEntry,
    Achievement, UserAchievement, MacroTarget, CalculatorResult,
    UserProfile
)
from .serializers import (
    NutritionLogSerializer, MacroTargetSerializer, CalculatorResultSerializer
)
import logging

logger = logging.getLogger(__name__)

class DataExporter:
    """Handles data export in multiple formats"""
    
    def __init__(self, user):
        self.user = user
        self.data = {}
    
    def collect_user_data(self):
        """Collect all user data from various models"""
        try:
            # Core fitness data
            self.data['workouts'] = WorkoutSession.objects.filter(user=self.user).values()
            self.data['nutrition_logs'] = NutritionLog.objects.filter(user=self.user).values()
            
            # Progress and analytics
            self.data['progress_analytics'] = ProgressAnalytics.objects.filter(user=self.user).values()
            self.data['personal_records'] = PersonalRecord.objects.filter(user=self.user).values()
            self.data['workout_streaks'] = WorkoutStreak.objects.filter(user=self.user).values()
            
            # Social features
            self.data['user_connections'] = UserConnection.objects.filter(user=self.user).values()
            self.data['challenges'] = Challenge.objects.filter(created_by=self.user).values()
            self.data['challenge_participations'] = ChallengeParticipation.objects.filter(user=self.user).values()
            self.data['leaderboard_entries'] = LeaderboardEntry.objects.filter(user=self.user).values()
            
            # Achievements
            self.data['user_achievements'] = UserAchievement.objects.filter(user=self.user).values()
            
            # Calculator data
            self.data['macro_targets'] = MacroTarget.objects.filter(user=self.user).values()
            self.data['calculator_results'] = CalculatorResult.objects.filter(user=self.user).values()
            
            # User profile data
            try:
                profile = self.user.tracker_profile
                self.data['user_profile'] = {
                    'height': profile.height,
                    'weight': profile.weight,
                    'age': profile.age,
                    'gender': profile.gender,
                    'activity_level': profile.activity_level,
                    'fitness_goals': profile.fitness_goals,
                    'preferred_units': profile.preferred_units,
                    'timezone': profile.timezone,
                    'equipment_available': profile.equipment_available,
                    'dietary_restrictions': profile.dietary_restrictions,
                    'medical_conditions': profile.medical_conditions,
                    'onboarding_completed': profile.onboarding_completed,
                    'created_at': profile.created_at.isoformat() if profile.created_at else None,
                    'updated_at': profile.updated_at.isoformat() if profile.updated_at else None
                }
            except:
                self.data['user_profile'] = None
            
            # Export metadata
            self.data['export_metadata'] = {
                'exported_at': datetime.now().isoformat(),
                'user_id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'data_version': '1.0',
                'total_records': sum(len(records) for records in self.data.values() if isinstance(records, list))
            }
            
            return True
            
        except Exception as e:
            logger.error(f"Error collecting user data: {str(e)}")
            return False
    
    def export_to_json(self):
        """Export data as JSON"""
        if not self.collect_user_data():
            return None
        
        # Convert datetime objects to strings
        def convert_datetime(obj):
            if isinstance(obj, dict):
                return {k: convert_datetime(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_datetime(item) for item in obj]
            elif hasattr(obj, 'isoformat'):
                return obj.isoformat()
            return obj
        
        converted_data = convert_datetime(self.data)
        return json.dumps(converted_data, indent=2, default=str)
    
    def export_to_csv(self, data_type='all'):
        """Export data as CSV"""
        if not self.collect_user_data():
            return None
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        if data_type == 'all':
            # Export all data types
            for data_type_name, records in self.data.items():
                if isinstance(records, list) and records:
                    writer.writerow([f"=== {data_type_name.upper()} ==="])
                    writer.writerow(records[0].keys())  # Header
                    for record in records:
                        writer.writerow(record.values())
                    writer.writerow([])  # Empty row separator
        else:
            # Export specific data type
            if data_type in self.data and isinstance(self.data[data_type], list):
                records = self.data[data_type]
                if records:
                    writer.writerow(records[0].keys())  # Header
                    for record in records:
                        writer.writerow(record.values())
        
        return output.getvalue()
    
    def export_to_pdf_summary(self):
        """Export a summary report as PDF (simplified version)"""
        if not self.collect_user_data():
            return None
        
        # Create a simple text-based summary that could be converted to PDF
        summary = f"""
MAVERICK AIM RUSH - FITNESS DATA SUMMARY
========================================

User: {self.user.username} ({self.user.email})
Export Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

WORKOUT DATA:
- Total Workouts: {len(self.data.get('workouts', []))}
- Personal Records: {len(self.data.get('personal_records', []))}
- Current Streak: {self.data.get('workout_streaks', [{}])[0].get('current_streak', 0) if self.data.get('workout_streaks') else 0} days

NUTRITION DATA:
- Total Nutrition Logs: {len(self.data.get('nutrition_logs', []))}
- Macro Targets: {len(self.data.get('macro_targets', []))}

SOCIAL FEATURES:
- Friends/Connections: {len(self.data.get('user_connections', []))}
- Challenges Participated: {len(self.data.get('challenge_participations', []))}
- Achievements Unlocked: {len(self.data.get('user_achievements', []))}

PROGRESS ANALYTICS:
- Progress Records: {len(self.data.get('progress_analytics', []))}
- Calculator Results: {len(self.data.get('calculator_results', []))}

TOTAL RECORDS EXPORTED: {self.data.get('export_metadata', {}).get('total_records', 0)}
        """
        
        return summary.strip()


class DataImporter:
    """Handles data import and validation"""
    
    def __init__(self, user):
        self.user = user
        self.errors = []
        self.warnings = []
        self.imported_count = 0
    
    def validate_json_data(self, json_data):
        """Validate imported JSON data"""
        try:
            data = json.loads(json_data)
            
            # Check required metadata
            if 'export_metadata' not in data:
                self.errors.append("Missing export metadata")
                return False
            
            metadata = data['export_metadata']
            required_fields = ['exported_at', 'user_id', 'data_version']
            for field in required_fields:
                if field not in metadata:
                    self.errors.append(f"Missing required field in metadata: {field}")
            
            # Check data version compatibility
            if metadata.get('data_version') != '1.0':
                self.warnings.append(f"Data version {metadata.get('data_version')} may not be fully compatible")
            
            return len(self.errors) == 0
            
        except json.JSONDecodeError as e:
            self.errors.append(f"Invalid JSON format: {str(e)}")
            return False
        except Exception as e:
            self.errors.append(f"Validation error: {str(e)}")
            return False
    
    def import_data(self, json_data, import_options=None):
        """Import data from JSON"""
        if not self.validate_json_data(json_data):
            return False
        
        try:
            data = json.loads(json_data)
            import_options = import_options or {}
            
            # Import user profile first
            if 'user_profile' in data and data['user_profile']:
                self._import_user_profile(data['user_profile'], import_options)
            
            # Import core data
            if import_options.get('import_workouts', True):
                self._import_workouts(data.get('workouts', []), import_options)
            
            if import_options.get('import_nutrition', True):
                self._import_nutrition_logs(data.get('nutrition_logs', []), import_options)
            
            if import_options.get('import_schedules', True):
                self._import_weekly_schedules(data.get('weekly_schedules', []), import_options)
            
            # Import progress data
            if import_options.get('import_progress', True):
                self._import_progress_data(data, import_options)
            
            # Import social data
            if import_options.get('import_social', True):
                self._import_social_data(data, import_options)
            
            return True
            
        except Exception as e:
            self.errors.append(f"Import error: {str(e)}")
            logger.error(f"Data import error: {str(e)}")
            return False
    
    def _import_user_profile(self, profile_data, options):
        """Import user profile data"""
        try:
            from .models import UserProfile
            
            profile, created = UserProfile.objects.get_or_create(
                user=self.user,
                defaults={
                    'height': profile_data.get('height'),
                    'weight': profile_data.get('weight'),
                    'age': profile_data.get('age'),
                    'gender': profile_data.get('gender'),
                    'activity_level': profile_data.get('activity_level'),
                    'fitness_goals': profile_data.get('fitness_goals'),
                    'preferred_units': profile_data.get('preferred_units', 'imperial'),
                    'timezone': profile_data.get('timezone'),
                    'equipment_available': profile_data.get('equipment_available'),
                    'dietary_restrictions': profile_data.get('dietary_restrictions'),
                    'medical_conditions': profile_data.get('medical_conditions'),
                    'onboarding_completed': profile_data.get('onboarding_completed', True)
                }
            )
            
            if not created and options.get('overwrite_profile', False):
                for field, value in profile_data.items():
                    if hasattr(profile, field):
                        setattr(profile, field, value)
                profile.save()
            
            self.imported_count += 1
            
        except Exception as e:
            self.errors.append(f"Error importing user profile: {str(e)}")
    
    def _import_workouts(self, workouts_data, options):
        """Import workout data"""
        for workout_data in workouts_data:
            try:
                # Remove user field from data to avoid conflicts
                workout_data_copy = workout_data.copy()
                workout_data_copy.pop('user', None)
                workout_data_copy.pop('id', None)
                
                workout = WorkoutSession.objects.create(
                    user=self.user,
                    **workout_data_copy
                )
                self.imported_count += 1
                
            except Exception as e:
                self.errors.append(f"Error importing workout: {str(e)}")
    
    def _import_nutrition_logs(self, nutrition_data, options):
        """Import nutrition log data"""
        for nutrition_log_data in nutrition_data:
            try:
                nutrition_log_data_copy = nutrition_log_data.copy()
                nutrition_log_data_copy.pop('user', None)
                nutrition_log_data_copy.pop('id', None)
                
                NutritionLog.objects.create(
                    user=self.user,
                    **nutrition_log_data_copy
                )
                self.imported_count += 1
                
            except Exception as e:
                self.errors.append(f"Error importing nutrition log: {str(e)}")
    
    def _import_weekly_schedules(self, schedules_data, options):
        """Import weekly schedule data"""
        # WeeklySchedule model doesn't exist, skip this import
        pass
    
    def _import_progress_data(self, data, options):
        """Import progress and analytics data"""
        # Import progress analytics
        for progress_data in data.get('progress_analytics', []):
            try:
                progress_data_copy = progress_data.copy()
                progress_data_copy.pop('user', None)
                progress_data_copy.pop('id', None)
                
                ProgressAnalytics.objects.create(
                    user=self.user,
                    **progress_data_copy
                )
                self.imported_count += 1
                
            except Exception as e:
                self.errors.append(f"Error importing progress analytics: {str(e)}")
        
        # Import personal records
        for pr_data in data.get('personal_records', []):
            try:
                pr_data_copy = pr_data.copy()
                pr_data_copy.pop('user', None)
                pr_data_copy.pop('id', None)
                
                PersonalRecord.objects.create(
                    user=self.user,
                    **pr_data_copy
                )
                self.imported_count += 1
                
            except Exception as e:
                self.errors.append(f"Error importing personal record: {str(e)}")
    
    def _import_social_data(self, data, options):
        """Import social features data"""
        # Import achievements
        for achievement_data in data.get('user_achievements', []):
            try:
                achievement_data_copy = achievement_data.copy()
                achievement_data_copy.pop('user', None)
                achievement_data_copy.pop('id', None)
                
                UserAchievement.objects.create(
                    user=self.user,
                    **achievement_data_copy
                )
                self.imported_count += 1
                
            except Exception as e:
                self.errors.append(f"Error importing user achievement: {str(e)}")


# API Views
@api_view(['GET'])
@permission_classes([])  # Temporarily allow unauthenticated access for testing
def export_data(request):
    """Export user data in various formats"""
    format_type = request.GET.get('format', 'json')
    
    try:
        # If user is authenticated, use their data
        if request.user.is_authenticated:
            exporter = DataExporter(request.user)
            
            if format_type == 'json':
                data = exporter.export_to_json()
                if data:
                    response = HttpResponse(data, content_type='application/json')
                    response['Content-Disposition'] = f'attachment; filename="maverick_fitness_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json"'
                    return response
                else:
                    return Response({'error': 'Failed to export data'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            elif format_type == 'csv':
                data = exporter.export_to_csv()
                if data:
                    response = HttpResponse(data, content_type='text/csv')
                    response['Content-Disposition'] = f'attachment; filename="maverick_fitness_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
                    return response
                else:
                    return Response({'error': 'Failed to export data'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            elif format_type == 'summary':
                data = exporter.export_to_pdf_summary()
                if data:
                    response = HttpResponse(data, content_type='text/plain')
                    response['Content-Disposition'] = f'attachment; filename="maverick_fitness_summary_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt"'
                    return response
                else:
                    return Response({'error': 'Failed to export summary'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            else:
                return Response({'error': 'Unsupported format'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # For unauthenticated users, provide sample export data
            sample_data = {
                'user_id': 'sample',
                'username': 'demo_user',
                'export_date': datetime.now().isoformat(),
                'data': {
                    'workouts': [
                        {
                            'id': 1,
                            'date': '2024-01-15',
                            'workout_type': 'strength',
                            'duration_minutes': 45,
                            'notes': 'Great workout!'
                        }
                    ],
                    'nutrition_logs': [
                        {
                            'id': 1,
                            'date': '2024-01-15',
                            'meal_type': 'breakfast',
                            'calories': 350,
                            'protein_g': 25,
                            'carbs_g': 30,
                            'fat_g': 15
                        }
                    ]
                },
                'sample_data': True,
                'message': 'This is sample data. Please log in to export your actual data.'
            }
            
            if format_type == 'json':
                response = HttpResponse(json.dumps(sample_data, indent=2), content_type='application/json')
                response['Content-Disposition'] = f'attachment; filename="sample_fitness_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json"'
                return response
            elif format_type == 'csv':
                csv_content = "Date,Type,Description\n2024-01-15,Workout,Strength Training\n2024-01-15,Nutrition,Breakfast\n"
                response = HttpResponse(csv_content, content_type='text/csv')
                response['Content-Disposition'] = f'attachment; filename="sample_fitness_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
                return response
            elif format_type == 'summary':
                summary_content = "MAVERICK AIM RUSH - FITNESS DATA SUMMARY\n\nSample Data Export\nGenerated: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "\n\nThis is sample data. Please log in to export your actual fitness data.\n\nWorkouts: 1\nNutrition Logs: 1\n\nThank you for using Maverick Aim Rush!"
                response = HttpResponse(summary_content, content_type='text/plain')
                response['Content-Disposition'] = f'attachment; filename="sample_fitness_summary_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt"'
                return response
            else:
                return Response({'error': 'Unsupported format'}, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Export error: {str(e)}")
        return Response({'error': 'Export failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_data(request):
    """Import user data from JSON"""
    try:
        json_data = request.data.get('data')
        import_options = request.data.get('options', {})
        
        if not json_data:
            return Response({'error': 'No data provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        importer = DataImporter(request.user)
        success = importer.import_data(json_data, import_options)
        
        response_data = {
            'success': success,
            'imported_count': importer.imported_count,
            'errors': importer.errors,
            'warnings': importer.warnings
        }
        
        if success:
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Import error: {str(e)}")
        return Response({'error': 'Import failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([])  # Temporarily allow unauthenticated access for testing
def export_status(request):
    """Get export/import status and available formats"""
    return Response({
        'available_formats': ['json', 'csv', 'summary'],
        'supported_import_formats': ['json'],
        'max_file_size': '10MB',
        'data_types': [
            'workouts', 'nutrition_logs', 'weekly_schedules',
            'progress_analytics', 'personal_records', 'workout_streaks',
            'user_connections', 'challenges', 'challenge_participations',
            'leaderboard_entries', 'user_achievements', 'macro_targets',
            'calculator_results', 'user_profile'
        ]
    })
