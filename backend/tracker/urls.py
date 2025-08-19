from django.urls import path
from .views import NutritionLogView, WorkoutHistoryView, ScheduleStateView, UserProfileView, GenerateProgramView, ProgramPlanView, ProgramPlanGenerateView

urlpatterns = [
	path('nutrition-log/', NutritionLogView.as_view(), name='nutrition_log'),
	path('workouts/', WorkoutHistoryView.as_view(), name='workout_history'),
	path('schedule-state/', ScheduleStateView.as_view(), name='schedule_state'),
	path('profile/', UserProfileView.as_view(), name='user_profile'),
	# legacy generate endpoint (kept for now)
	path('generate-program/', GenerateProgramView.as_view(), name='generate_program'),
	# new plan endpoints
	path('program/', ProgramPlanView.as_view(), name='program_plan'),
	path('program/generate/', ProgramPlanGenerateView.as_view(), name='program_plan_generate'),
]
