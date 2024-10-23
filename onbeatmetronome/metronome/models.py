from django.db import models

class PracticeSession(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)     # When the session was created
    bpm = models.IntegerField(default=60)                   # Beats Per Minute
    time_signature = models.CharField(max_length=10, default="4/4")  # Time signature
    duration = models.DurationField()                       # Total duration of the practice
    longest_on_beat_streak = models.DurationField(null=True, blank=True)  # Longest streak on-beat
    accuracy = models.FloatField(default=0.0)               # Accuracy percentage

    def __str__(self):
        return f"Session at {self.timestamp} - BPM: {self.bpm}"
