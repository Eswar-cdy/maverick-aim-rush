import django_filters
from django.db.models import Q
from .models import ExerciseCatalog, Equipment, Muscle, ExerciseMuscle

class ExerciseFilter(django_filters.FilterSet):
    """
    Declarative filter set for the ExerciseCatalog model using django-filter.
    Enables precise, case-insensitive filtering on various fields.
    """
    category = django_filters.CharFilter(field_name='category', lookup_expr='iexact')
    difficulty_level = django_filters.CharFilter(field_name='difficulty_level', lookup_expr='iexact')
    recommended_for_goal = django_filters.CharFilter(field_name='recommended_for_goal', lookup_expr='iexact')
    
    # Filter by many-to-many relationships using their names
    equipment = django_filters.CharFilter(field_name='equipments__name', lookup_expr='iexact')
    # Any muscle (primary or secondary)
    muscle = django_filters.CharFilter(field_name='muscles__name', lookup_expr='iexact')
    # Optional: strictly primary or strictly secondary
    primary_muscle = django_filters.CharFilter(method='filter_primary_muscle')
    secondary_muscle = django_filters.CharFilter(method='filter_secondary_muscle')

    # A custom search method to look across multiple fields
    search = django_filters.CharFilter(method='filter_by_search_term', label="Search")

    class Meta:
        model = ExerciseCatalog
        fields = ['category', 'difficulty_level', 'recommended_for_goal', 'equipment', 'muscle', 'primary_muscle', 'secondary_muscle']

    def filter_by_search_term(self, queryset, name, value):
        """
        Custom filter method for the 'search' parameter.
        Searches across the exercise name and description.
        """
        if not value:
            return queryset
        return queryset.filter(
            Q(name__icontains=value) | Q(description__icontains=value)
        )

    def filter_primary_muscle(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            exercisemuscle__role='primary',
            exercisemuscle__muscle__name__iexact=value
        )

    def filter_secondary_muscle(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            exercisemuscle__role='secondary',
            exercisemuscle__muscle__name__iexact=value
        )
