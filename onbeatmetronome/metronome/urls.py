from django.urls import path
from . import views

urlpatterns = [
    path('', views.metronome_view, name='metronome'),  # This is now the main (and only) page
]
