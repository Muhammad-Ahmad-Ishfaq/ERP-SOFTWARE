from rest_framework import serializers
from django.db import IntegrityError
from .models import Company, UserProfile
from apps.users.models import User

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    company_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = UserProfile
        fields = ('id', 'user', 'company_id')

    def get_user(self, obj):
        return {
            'id': obj.user.USER_ID,
            'username': obj.user.USER_NAME,
            'role': obj.user.USER_ROLE,
        }

    def create(self, validated_data):
        company_id = validated_data.pop('company_id')
        company = Company.objects.get(id=company_id)

        user_data = self.context.get('user_data')
        if not user_data:
            raise serializers.ValidationError({'user': 'User data is required'})

        # Check if username already exists
        if User.objects.filter(USER_NAME=user_data['username']).exists():
            raise serializers.ValidationError(
                {'username': 'A user with this username already exists.'}
            )

        try:
            user = User.objects.create_user(
                username=user_data['username'],
                password=user_data['password'],
                USER_ROLE=user_data.get('role', 'user'),
                IS_ACTIVE=True,
            )
        except IntegrityError:
            raise serializers.ValidationError(
                {'username': 'This username is already taken.'}
            )

        profile = UserProfile.objects.create(user=user, company=company)
        return profile