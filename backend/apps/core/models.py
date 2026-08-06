from django.db import models
from apps.users.models import User

class Company(models.Model):
    name = models.CharField(max_length=200)
    business_type = models.CharField(max_length=50, blank=True, null=True)
    industry = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    mobile = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    ntn = models.CharField(max_length=30, blank=True, null=True)
    gst_no = models.CharField(max_length=30, blank=True, null=True)
    year = models.IntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'company'

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='users')

    class Meta:
        db_table = 'user_profile'

    def __str__(self):
        return f"{self.user.USER_NAME} - {self.company.name}"