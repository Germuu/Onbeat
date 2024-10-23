from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('sessions/', views.session_list, name='session_list'),
]
