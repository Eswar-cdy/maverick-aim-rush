from django.db import migrations
from django.utils.text import slugify

def populate_slugs(apps, schema_editor):
    Exercise = apps.get_model('workouts', 'ExerciseCatalog')

    batch_size = 500
    qs = Exercise.objects.filter(slug__isnull=True).order_by('pk')
    # Process in batches to avoid large transactions / memory usage
    start = 0
    while True:
        batch = list(qs[start:start + batch_size])
        if not batch:
            break
        to_update = []
        for ex in batch:
            base = slugify(ex.name)[:110] if ex.name else 'exercise'
            candidate = base
            i = 1
            # ensure uniqueness among existing rows
            while Exercise.objects.filter(slug=candidate).exclude(pk=ex.pk).exists():
                candidate = f"{base}-{i}"
                i += 1
            ex.slug = candidate
            to_update.append(ex)
        # Use bulk_update for efficiency
        if to_update:
            Exercise.objects.bulk_update(to_update, ['slug'])
        start += batch_size

def reverse_populate_slugs(apps, schema_editor):
    # No-op reverse: keep generated slugs on rollback to avoid data loss.
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('workouts', '0002_add_exercise_slug'),
    ]

    operations = [
        migrations.RunPython(populate_slugs, reverse_populate_slugs),
    ]
