from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.core.cache import cache
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone
from datetime import timedelta
import json
from .models import UserProfile, CachedData

def index(request):
    if request.user.is_authenticated:
        return redirect('profile')
    return redirect('login')

@ensure_csrf_cookie
def login_page(request):
    if request.user.is_authenticated:
        return redirect('profile')
    return render(request, 'core/login.html')

@ensure_csrf_cookie
def register_page(request):
    if request.user.is_authenticated:
        return redirect('profile')
    return render(request, 'core/register.html')

@require_http_methods(["POST"])
def register(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return JsonResponse({'error': 'Необходимо указать логин и пароль'}, status=400)
        
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Пользователь уже существует'}, status=400)
        
        # Django автоматически хеширует пароль
        user = User.objects.create_user(username=username, password=password)
        UserProfile.objects.create(user=user)
        
        return JsonResponse({'message': 'Регистрация успешна'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["POST"])
def login_view(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        user = authenticate(username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({'message': 'Вход выполнен успешно'})
        return JsonResponse({'error': 'Неверные учетные данные'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def profile(request):
    return render(request, 'core/profile.html')

@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({'message': 'Выход выполнен успешно'})

@login_required
def get_data(request):
    # Добавляем идентификатор пользователя в ключ кэша
    cache_key = f'api_data_{request.user.id}'
    cached_data = cache.get(cache_key)
    
    if cached_data is None:
        # Генерация более информативных данных
        current_time = timezone.now()
        
        data = {
            "info": {
                "timestamp": current_time.isoformat(),
                "cache_status": "Данные только что сгенерированы",
                "is_cached": False,
                "cache_key": cache_key
            },
            "user": {
                "username": request.user.username,
                "last_login": request.user.last_login.isoformat() if request.user.last_login else None,
                "is_active": request.user.is_active
            },
            "stats": {
                "total_users": User.objects.count(),
                "active_users": User.objects.filter(is_active=True).count(),
                "server_time": {
                    "date": current_time.strftime("%d.%m.%Y"),
                    "time": current_time.strftime("%H:%M:%S"),
                    "timezone": "GMT"
                }
            },
            "system": {
                "cache_expires_in": "60 секунд",
                "django_version": "5.0.2",
                "python_version": "3.12.0"
            }
        }
        
        # Сохраняем данные в кэш Django
        cache.set(cache_key, data, 60)  # Кэширование на 1 минуту
        
        # Сохраняем данные в модели CachedData
        expires_at = current_time + timedelta(minutes=1)
        CachedData.objects.update_or_create(
            key=cache_key,
            defaults={'value': data, 'expires_at': expires_at}
        )
        
        return JsonResponse(data)
    else:
        # Добавляем информацию о том, что данные взяты из кэша
        cached_data["info"]["is_cached"] = True
        cached_data["info"]["cache_status"] = "Данные взяты из кэша"
        return JsonResponse(cached_data)
