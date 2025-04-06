from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', views.login_page, name='login'),
    path('register/', views.register_page, name='register'),
    path('api/login/', views.login_view, name='api_login'),
    path('api/register/', views.register, name='api_register'),
    path('profile/', views.profile, name='profile'),
    path('api/logout/', views.logout_view, name='api_logout'),
    path('api/data/', views.get_data, name='api_data'),
] 