from rest_framework import serializers
from .models import ACSetup

class ACSetupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ACSetup
        fields = '__all__'