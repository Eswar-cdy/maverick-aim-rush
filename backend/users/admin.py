from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'unit_system', 'distance_unit', 'timezone',
        'primary_goal', 'days_per_week', 'updated_at'
    )
    search_fields = ('user__username', 'equipment')
    list_filter = ('unit_system', 'distance_unit', 'primary_goal')
