from django.db import models

# Create your models here.
from django.db import models

class Location(models.Model):
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=20, unique=True, db_column='code')
    name = models.CharField(max_length=100, db_column='name')
    description = models.CharField(max_length=255, blank=True, null=True, db_column='description')
    is_active = models.BooleanField(default=True, db_column='is_active')
    created_at = models.DateTimeField(auto_now_add=True, db_column='created_at')
    updated_at = models.DateTimeField(auto_now=True, db_column='updated_at')

    class Meta:
        db_table = 'locations'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"