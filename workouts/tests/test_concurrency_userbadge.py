from django.test import TestCase
import threading
from django.contrib.auth import get_user_model
import pytest
from django.db import connections

from workouts.models import ExerciseCatalog, WorkoutSession, StrengthSet, Badge, UserBadge

@pytest.mark.django_db(transaction=True)
def test_concurrent_pr_award_results_in_single_userbadge():
    """
    Simulate two near-simultaneous StrengthSet creations that should both trigger PR detection.
    The badge-awarding path must be idempotent/race-safe (transaction.atomic + get_or_create).
    The test asserts that only one UserBadge is created.
    """
    User = get_user_model()
    user = User.objects.create_user(username='concurrent_user', password='pass')

    # Create minimal exercise and session objects
    exercise = ExerciseCatalog.objects.create(name='Concurrent Lift', slug='concurrent-lift')
    session = WorkoutSession.objects.create(user=user)

    # Create a badge that should be awarded on any PR (criteria type 'pr')
    badge = Badge.objects.create(slug='first-pr-concurrent', name='First PR (concurrent)', criteria={'type': 'pr'})

    # Barrier to try to start both threads at the same time
    barrier = threading.Barrier(2)

    def create_pr_set():
        # Ensure this thread gets a fresh DB connection
        connections.close_all()
        # Wait for both threads to be ready
        barrier.wait()
        # Create a StrengthSet that should be detected as a PR
        StrengthSet.objects.create(session=session, exercise=exercise, weight=120.0, reps=3)

    # Start two threads that will try to create PR sets concurrently
    t1 = threading.Thread(target=create_pr_set)
    t2 = threading.Thread(target=create_pr_set)
    t1.start()
    t2.start()
    t1.join()
    t2.join()

    # Refresh counts and assert exactly one UserBadge exists
    sets_count = StrengthSet.objects.filter(session=session, exercise=exercise).count()
    assert sets_count == 2, f"expected 2 StrengthSet rows, got {sets_count}"

    ub_count = UserBadge.objects.filter(user=user, badge=badge).count()
    assert ub_count == 1, f"expected 1 UserBadge, got {ub_count}"
