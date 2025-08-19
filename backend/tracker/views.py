from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import NutritionLog, Workout, ScheduleState, UserProfile, ProgramPlan
from .serializers import NutritionLogSerializer, WorkoutSerializer, ScheduleStateSerializer, UserProfileSerializer, ProgramPlanSerializer
from .program_generator import ProgramGenerator
import datetime

# Create your views here.

class NutritionLogView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		log, created = NutritionLog.objects.get_or_create(
			user=request.user, 
			date=datetime.date.today()
		)
		serializer = NutritionLogSerializer(log, context={'request': request})
		return Response(serializer.data)

	def post(self, request):
		log, created = NutritionLog.objects.get_or_create(
			user=request.user, 
			date=datetime.date.today()
		)
		serializer = NutritionLogSerializer(log, data=request.data, partial=True, context={'request': request})
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class WorkoutHistoryView(generics.ListCreateAPIView):
	serializer_class = WorkoutSerializer
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		return Workout.objects.filter(user=self.request.user).order_by('-date')

	def perform_create(self, serializer):
		serializer.save(user=self.request.user)

class ScheduleStateView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		schedule, created = ScheduleState.objects.get_or_create(user=request.user)
		serializer = ScheduleStateSerializer(schedule)
		return Response(serializer.data)

	def post(self, request):
		schedule, created = ScheduleState.objects.get_or_create(user=request.user)
		serializer = ScheduleStateSerializer(schedule, data=request.data, partial=True)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		profile, _ = UserProfile.objects.get_or_create(user=request.user)
		serializer = UserProfileSerializer(profile)
		return Response(serializer.data)

	def post(self, request):
		profile, _ = UserProfile.objects.get_or_create(user=request.user)
		serializer = UserProfileSerializer(profile, data=request.data, partial=True)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GenerateProgramView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		generator = ProgramGenerator(request.user)
		plan = generator.generate_workout_plan()
		return Response(plan)

class ProgramPlanView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		try:
			program = ProgramPlan.objects.get(user=request.user)
		except ProgramPlan.DoesNotExist:
			return Response(status=status.HTTP_204_NO_CONTENT)
		serializer = ProgramPlanSerializer(program)
		return Response(serializer.data)

class ProgramPlanGenerateView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		# ensure profile exists
		UserProfile.objects.get_or_create(user=request.user)
		# build plan
		generator = ProgramGenerator(request.user)
		plan = generator.generate_workout_plan()
		program, _ = ProgramPlan.objects.update_or_create(
			user=request.user,
			defaults={"plan": plan}
		)
		serializer = ProgramPlanSerializer(program)
		return Response(serializer.data, status=status.HTTP_201_CREATED)
