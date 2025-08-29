from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import NutritionLog
from .serializers import NutritionLogSerializer
import datetime

class NutritionLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get or create a nutrition log for the current user for today
        log, created = NutritionLog.objects.get_or_create(
            user=request.user, 
            date=datetime.date.today()
        )
        serializer = NutritionLogSerializer(log)
        return Response(serializer.data)

    def post(self, request):
        # Update the nutrition log for the current user for today
        try:
            log = NutritionLog.objects.get(
                user=request.user, 
                date=datetime.date.today()
            )
            serializer = NutritionLogSerializer(log, data=request.data, partial=True) # partial=True allows partial updates
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except NutritionLog.DoesNotExist:
            return Response({"error": "Log not found. Please make a GET request first to create one."}, status=status.HTTP_404_NOT_FOUND)
