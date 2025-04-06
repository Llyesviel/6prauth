from django.contrib import admin
from .models import UserProfile, CachedData

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'theme', 'created_at', 'updated_at')
    search_fields = ('user__username',)
    list_filter = ('theme', 'created_at')

@admin.register(CachedData)
class CachedDataAdmin(admin.ModelAdmin):
    list_display = ('key', 'created_at', 'expires_at')
    search_fields = ('key',)
    list_filter = ('created_at', 'expires_at')
