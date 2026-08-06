from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

class UserAdmin(BaseUserAdmin):
    list_display = ('USER_NAME', 'USER_ROLE', 'IS_ACTIVE', 'CREATED_AT')
    search_fields = ('USER_NAME',)
    ordering = ('USER_NAME',)
    list_filter = ('USER_ROLE', 'IS_ACTIVE')
    fieldsets = (
        (None, {'fields': ('USER_NAME', 'password')}),
        ('Personal info', {'fields': ('USER_ROLE',)}),
        ('Permissions', {'fields': ('IS_ACTIVE', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('last_login', 'CREATED_AT', 'UPDATED_AT')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('USER_NAME', 'password1', 'password2', 'USER_ROLE', 'IS_ACTIVE'),
        }),
    )

admin.site.register(User, UserAdmin)