from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tracker', '0023_live_minute_buckets'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='completed_onboarding_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='onboarding_version',
            field=models.CharField(default='v1', max_length=16),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='onboarding_state',
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='onboarding_answers',
            field=models.JSONField(blank=True, null=True),
        ),
    ]


