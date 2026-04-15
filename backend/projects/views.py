from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
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

    @action(detail=True, methods=['post'])
    def sync_with_tasks(self, request, pk=None):
        """Synchronise manuellement un projet avec ses tâches"""
        project = self.get_object()
        sync_result = project.sync_with_tasks()
        
        # Sauvegarder les changements
        project.save()
        
        return Response({
            'message': 'Projet synchronisé avec succès',
            'project_id': project.id,
            'project_name': project.name,
            'sync_result': sync_result
        })

    @action(detail=False, methods=['post'])
    def sync_all_projects(self, request):
        """Synchronise tous les projets avec leurs tâches"""
        projects = Project.objects.all()
        results = []
        
        for project in projects:
            sync_result = project.sync_with_tasks()
            project.save()
            
            results.append({
                'project_id': project.id,
                'project_name': project.name,
                'sync_result': sync_result
            })
        
        return Response({
            'message': f'{len(projects)} projets synchronisés',
            'results': results
        })

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
