from django.shortcuts import render, redirect
from .models import PracticeSession
from datetime import timedelta

def home(request):
    return render(request, 'metronome/home.html')

def session_list(request):
    sessions = PracticeSession.objects.all()
    return render(request, 'metronome/session_list.html', {'sessions': sessions})

def create_session(request):
    if request.method == 'POST':
        bpm = request.POST.get('bpm', 60)  # Get BPM from the form, default is 60
        duration_minutes = int(request.POST.get('duration', 1))  # Duration in minutes (default is 1)
        
        # Create a new PracticeSession
        session = PracticeSession.objects.create(
            bpm=int(bpm),
            duration=timedelta(minutes=duration_minutes),
        )
        
        # Redirect to the session list view after creation
        return redirect('session_list')
    
    return render(request, 'metronome/create_session.html')