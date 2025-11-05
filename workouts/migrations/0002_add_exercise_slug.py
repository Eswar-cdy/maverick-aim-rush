from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workouts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='exercisecatalog',
            name='slug',
            field=models.SlugField(max_length=120, blank=True, null=True, help_text='Stable identifier'),
        ),
    ]
