from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workouts', '0003_populate_exercise_slugs'),
    ]

    operations = [
        migrations.AlterField(
            model_name='exercisecatalog',
            name='slug',
            field=models.SlugField(max_length=120, unique=True, blank=False, null=False, help_text='Stable identifier'),
        ),
    ]
