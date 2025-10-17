from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Project, Task, Milestone
from .serializers import ProjectSerializer, TaskSerializer, MilestoneSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().select_related('client', 'manager').prefetch_related('team')
    serializer_class = ProjectSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'client__name']
    filterset_fields = ['status', 'manager']
    ordering_fields = ['start_date', 'budget']

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().select_related('project', 'assignee')
    serializer_class = TaskSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['title']
    filterset_fields = ['status', 'priority', 'project', 'assignee']
    ordering_fields = ['start_date', 'priority']

class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.all().select_related('project')
    serializer_class = MilestoneSerializer
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ['status', 'project']
    ordering_fields = ['date']
