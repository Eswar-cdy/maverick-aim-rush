# Maverick Aim Rush - API v1 URLs
# This file contains all v1 API endpoints with proper versioning
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView, LoginView, NutritionLogViewSet, FoodCatalogViewSet, WorkoutSessionViewSet,
    StrengthSetViewSet, CardioEntryViewSet, ExerciseCatalogViewSet,
    MuscleViewSet, EquipmentViewSet, TagViewSet, WeeklyPlanView, ProgressStatsView, 
    ProgressExerciseTrendView, MeasurementViewSet, GoalViewSet, CalculatorView,
    MacroTargetViewSet, CalculatorResultViewSet, RecommendationsView,
    AnalyticsView, SocialView, LeaderboardView, FriendActivityView,
    ProgressPhotoViewSet, PhotoComparisonViewSet, BodyPartMeasurementViewSet,
    ProgressMilestoneViewSet, PhotoProgressAPIView, MuscleGroupViewSet,
    BodyCompositionViewSet, MuscleGroupMeasurementViewSet, BodyAnalyticsViewSet,
    ProgressPredictionViewSet, AdvancedAnalyticsAPIView,
    # Enhanced Nutrition Views
    FoodCategoryViewSet, RecipeViewSet, RecipeIngredientViewSet, RecipeInstructionViewSet,
    MealPlanViewSet, MealPlanDayViewSet, MealPlanMealViewSet, MealTemplateViewSet,
    NutritionGoalViewSet, WaterIntakeViewSet, SupplementLogViewSet, MealRatingViewSet,
    GroceryListViewSet, RestaurantFoodViewSet, NutritionalAnalysisViewSet,
    NutritionAnalyticsAPIView, MealPlanGeneratorAPIView, ProfileAPIView,
    TrainerProfileViewSet, ExerciseContraindicationViewSet,
    OnboardingStatusAPIView, OnboardingQuestionsAPIView, OnboardingAnswersAPIView, 
    OnboardingCompleteAPIView, OnboardingResetAPIView, UserProfileViewSet
)
from .auth_cookies import CookieTokenObtainPairView
from .export_import import export_data, import_data, export_status
from .gamification_views import (
    gamification_dashboard, user_badges, daily_quests, award_xp,
    leaderboard, streak_bonuses, complete_quest, initialize_gamification
)
from .notification_views import (
    subscribe_push_notifications, unsubscribe_push_notifications,
    notification_preferences, notification_history, test_notification,
    notification_stats, mark_notification_clicked, get_vapid_public_key,
    trigger_notification
)

# Create a router for v1 API endpoints
router_v1 = DefaultRouter()

# Core Fitness Resources
router_v1.register(r'exercises', ExerciseCatalogViewSet, basename='exercisecatalog')
router_v1.register(r'foods', FoodCatalogViewSet, basename='foodcatalog')
router_v1.register(r'muscles', MuscleViewSet, basename='muscle')
router_v1.register(r'equipments', EquipmentViewSet, basename='equipment')
router_v1.register(r'tags', TagViewSet, basename='tag')

# Workout Tracking
router_v1.register(r'sessions', WorkoutSessionViewSet, basename='workoutsession')
router_v1.register(r'strength-sets', StrengthSetViewSet, basename='strengthset')
router_v1.register(r'cardio-entries', CardioEntryViewSet, basename='cardioentry')

# Nutrition System
router_v1.register(r'nutrition-logs', NutritionLogViewSet, basename='nutritionlog')
router_v1.register(r'food-categories', FoodCategoryViewSet, basename='foodcategory')
router_v1.register(r'recipes', RecipeViewSet, basename='recipe')
router_v1.register(r'recipe-ingredients', RecipeIngredientViewSet, basename='recipeingredient')
router_v1.register(r'recipe-instructions', RecipeInstructionViewSet, basename='recipeinstruction')
router_v1.register(r'meal-plans', MealPlanViewSet, basename='mealplan')
router_v1.register(r'meal-plan-days', MealPlanDayViewSet, basename='mealplanday')
router_v1.register(r'meal-plan-meals', MealPlanMealViewSet, basename='mealplanmeal')
router_v1.register(r'meal-templates', MealTemplateViewSet, basename='mealtemplate')
router_v1.register(r'nutrition-goals', NutritionGoalViewSet, basename='nutritiongoal')
router_v1.register(r'water-intake', WaterIntakeViewSet, basename='waterintake')
router_v1.register(r'supplement-logs', SupplementLogViewSet, basename='supplementlog')
router_v1.register(r'meal-ratings', MealRatingViewSet, basename='mealrating')
router_v1.register(r'grocery-lists', GroceryListViewSet, basename='grocerylist')
router_v1.register(r'restaurant-foods', RestaurantFoodViewSet, basename='restaurantfood')
router_v1.register(r'nutritional-analyses', NutritionalAnalysisViewSet, basename='nutritionalanalysis')

# Progress & Analytics
router_v1.register(r'measurements', MeasurementViewSet, basename='measurement')
router_v1.register(r'goals', GoalViewSet, basename='goal')
router_v1.register(r'macro-targets', MacroTargetViewSet, basename='macrotarget')
router_v1.register(r'calculator-results', CalculatorResultViewSet, basename='calculatorresult')
router_v1.register(r'progress-photos', ProgressPhotoViewSet, basename='progressphoto')
router_v1.register(r'photo-comparisons', PhotoComparisonViewSet, basename='photocomparison')
router_v1.register(r'body-measurements', BodyPartMeasurementViewSet, basename='bodypartmeasurement')
router_v1.register(r'progress-milestones', ProgressMilestoneViewSet, basename='progressmilestone')
router_v1.register(r'muscle-groups', MuscleGroupViewSet, basename='musclegroup')
router_v1.register(r'body-compositions', BodyCompositionViewSet, basename='bodycomposition')
router_v1.register(r'muscle-group-measurements', MuscleGroupMeasurementViewSet, basename='musclegroupmeasurement')
router_v1.register(r'body-analytics', BodyAnalyticsViewSet, basename='bodyanalytics')
router_v1.register(r'progress-predictions', ProgressPredictionViewSet, basename='progressprediction')

# Professional Features
router_v1.register(r'trainer-profile', TrainerProfileViewSet, basename='trainerprofile')
router_v1.register(r'exercise-contras', ExerciseContraindicationViewSet, basename='exercisecontra')
router_v1.register(r'profile', UserProfileViewSet, basename='userprofile')

# API v1 URL patterns
urlpatterns = [
    # Router URLs (ViewSets)
    path('', include(router_v1.urls)),
    
    # Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='v1_auth_register'),
    path('auth/login/', LoginView.as_view(), name='v1_auth_login'),
    path('auth/login-cookie/', CookieTokenObtainPairView.as_view(), name='v1_auth_login_cookie'),
    
    # Analytics & Insights
    path('analytics/weekly-plan/', WeeklyPlanView.as_view(), name='v1_weekly_plan'),
    path('analytics/progress/summary/', ProgressStatsView.as_view(), name='v1_progress_summary'),
    path('analytics/progress/exercise-trend/', ProgressExerciseTrendView.as_view(), name='v1_progress_exercise_trend'),
    path('analytics/advanced/', AdvancedAnalyticsAPIView.as_view(), name='v1_advanced_analytics'),
    path('analytics/nutrition/', NutritionAnalyticsAPIView.as_view(), name='v1_nutrition_analytics'),
    
    # Calculators & Tools
    path('tools/calculator/', CalculatorView.as_view(), name='v1_calculator'),
    path('tools/recommendations/', RecommendationsView.as_view(), name='v1_recommendations'),
    path('tools/meal-plan-generator/', MealPlanGeneratorAPIView.as_view(), name='v1_meal_plan_generator'),
    
    # Social Features
    path('social/', SocialView.as_view(), name='v1_social'),
    path('social/leaderboards/<int:leaderboard_id>/', LeaderboardView.as_view(), name='v1_leaderboard'),
    path('social/friends/<int:friend_id>/activity/', FriendActivityView.as_view(), name='v1_friend_activity'),
    
    # Data Management
    path('data/export/', export_data, name='v1_export_data'),
    path('data/import/', import_data, name='v1_import_data'),
    path('data/export-status/', export_status, name='v1_export_status'),
    
    # Photo Progress
    path('progress/photo-progress/', PhotoProgressAPIView.as_view(), name='v1_photo_progress'),
    
    # User Management
    path('profile/', ProfileAPIView.as_view(), name='v1_profile_upsert'),
    
    # Onboarding
    path('onboarding/status/', OnboardingStatusAPIView.as_view(), name='v1_onboarding_status'),
    path('onboarding/questions/', OnboardingQuestionsAPIView.as_view(), name='v1_onboarding_questions'),
    path('onboarding/answers/', OnboardingAnswersAPIView.as_view(), name='v1_onboarding_answers'),
    path('onboarding/complete/', OnboardingCompleteAPIView.as_view(), name='v1_onboarding_complete'),
    path('onboarding/reset/', OnboardingResetAPIView.as_view(), name='v1_onboarding_reset'),

    # Gamification System
    path('gamification/dashboard/', gamification_dashboard, name='v1_gamification_dashboard'),
    path('gamification/badges/', user_badges, name='v1_user_badges'),
    path('gamification/quests/', daily_quests, name='v1_daily_quests'),
    path('gamification/award-xp/', award_xp, name='v1_award_xp'),
    path('gamification/leaderboard/', leaderboard, name='v1_gamification_leaderboard'),
    path('gamification/streak-bonuses/', streak_bonuses, name='v1_streak_bonuses'),
        path('gamification/complete-quest/', complete_quest, name='v1_complete_quest'),
        path('gamification/initialize/', initialize_gamification, name='v1_initialize_gamification'),
        
        # Push Notifications
        path('notifications/subscribe/', subscribe_push_notifications, name='v1_subscribe_notifications'),
        path('notifications/unsubscribe/', unsubscribe_push_notifications, name='v1_unsubscribe_notifications'),
        path('notifications/preferences/', notification_preferences, name='v1_notification_preferences'),
        path('notifications/history/', notification_history, name='v1_notification_history'),
        path('notifications/test/', test_notification, name='v1_test_notification'),
        path('notifications/stats/', notification_stats, name='v1_notification_stats'),
        path('notifications/click/', mark_notification_clicked, name='v1_mark_notification_clicked'),
        path('notifications/vapid-key/', get_vapid_public_key, name='v1_vapid_public_key'),
        path('notifications/trigger/', trigger_notification, name='v1_trigger_notification'),
    ]
