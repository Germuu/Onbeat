from django.shortcuts import render

def metronome_view(request):
    return render(request, 'metronome/metronome.html')
