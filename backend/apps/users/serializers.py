from rest_framework import serializers
from django.db import IntegrityError, transaction
from .models import User
from apps.core.models import Company, UserProfile

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=100)
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(default='user')
    company_id = serializers.IntegerField()

    def validate_company_id(self, value):
        if not Company.objects.filter(id=value).exists():
            raise serializers.ValidationError("Company does not exist.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        try:
            user = User.objects.create_user(
                username=validated_data['username'],
                password=validated_data['password'],
                USER_ROLE=validated_data.get('role', 'user'),
                IS_ACTIVE=True,
            )
        except IntegrityError:
            raise serializers.ValidationError({"username": "This username is already taken."})

        # Check if profile already exists (should not happen, but safe)
        if UserProfile.objects.filter(user=user).exists():
            # If profile exists, we have an orphan; delete it and recreate.
            UserProfile.objects.filter(user=user).delete()

        company = Company.objects.get(id=validated_data['company_id'])
        UserProfile.objects.create(user=user, company=company)
        return user