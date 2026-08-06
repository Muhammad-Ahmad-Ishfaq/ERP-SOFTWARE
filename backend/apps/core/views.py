from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Company, UserProfile
from .serializers import CompanySerializer, UserProfileSerializer

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['get'])
    def check_exists(self, request):
        exists = Company.objects.exists()
        return Response({'exists': exists})

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        user_data = {
            'username': request.data.get('username'),
            'password': request.data.get('password'),
            'role': request.data.get('role', 'user'),
        }
        profile_data = {
            'company_id': request.data.get('company_id'),
        }

        if not user_data['username'] or not user_data['password']:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not profile_data['company_id']:
            return Response(
                {'error': 'Company ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=profile_data, context={'user_data': user_data})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)