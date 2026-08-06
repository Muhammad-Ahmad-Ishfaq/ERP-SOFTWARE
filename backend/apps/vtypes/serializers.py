from rest_framework import serializers
from .models import VType

class VTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VType
        fields = '__all__'