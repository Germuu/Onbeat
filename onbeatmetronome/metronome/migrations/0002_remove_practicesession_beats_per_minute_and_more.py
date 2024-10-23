# Generated by Django 5.1.2 on 2024-10-22 22:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('metronome', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='practicesession',
            name='beats_per_minute',
        ),
        migrations.RemoveField(
            model_name='practicesession',
            name='longest_on_beat',
        ),
        migrations.AddField(
            model_name='practicesession',
            name='bpm',
            field=models.IntegerField(default=60),
        ),
        migrations.AddField(
            model_name='practicesession',
            name='longest_on_beat_streak',
            field=models.DurationField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='practicesession',
            name='accuracy',
            field=models.FloatField(default=0.0),
        ),
        migrations.AlterField(
            model_name='practicesession',
            name='time_signature',
            field=models.CharField(default='4/4', max_length=10),
        ),
    ]
