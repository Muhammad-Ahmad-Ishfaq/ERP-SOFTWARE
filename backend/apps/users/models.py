from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        user = self.model(USER_NAME=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('IS_ACTIVE', True)
        return self.create_user(username, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    USER_ID = models.BigAutoField(primary_key=True, db_column='USER_ID')
    USER_NAME = models.CharField(max_length=100, unique=True, db_column='USER_NAME')
    password = models.CharField(max_length=255, db_column='USER_PWD')
    USER_ROLE = models.CharField(max_length=50, db_column='USER_ROLE', default='user')
    IS_ACTIVE = models.BooleanField(default=True, db_column='IS_ACTIVE')
    CREATED_AT = models.DateTimeField(auto_now_add=True, db_column='CREATED_AT')
    UPDATED_AT = models.DateTimeField(auto_now=True, db_column='UPDATED_AT')

    last_login = models.DateTimeField(blank=True, null=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    USERNAME_FIELD = 'USER_NAME'
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.USER_NAME

    @property
    def is_active(self):
        return self.IS_ACTIVE

    @is_active.setter
    def is_active(self, value):
        self.IS_ACTIVE = value

    # ✅ Add this to make JWT happy
    @property
    def id(self):
        return self.USER_ID