from django.contrib import admin
from .models import Project, Task, Milestone

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'client', 'status', 'progress', 'start_date', 'end_date', 'budget', 'manager']
    list_filter = ['status', 'start_date', 'end_date']
    search_fields = ['name', 'client__name', 'description']
    filter_horizontal = ['team']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('name', 'client', 'description')
        }),
        ('Planning et budget', {
            'fields': ('status', 'progress', 'start_date', 'end_date', 'budget', 'spent')
        }),
        ('Équipe', {
            'fields': ('manager', 'team')
        }),
        ('Métadonnées', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'status', 'priority', 'assignee', 'start_date', 'end_date', 'progress']
    list_filter = ['status', 'priority', 'project', 'start_date']
    search_fields = ['title', 'description', 'project__name']
    
    fieldsets = (
        ('Informations de la tâche', {
            'fields': ('title', 'description', 'project')
        }),
        ('Détails d\'exécution', {
            'fields': ('status', 'priority', 'assignee', 'progress')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date')
        })
    )

@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'date', 'status']
    list_filter = ['status', 'project', 'date']
    search_fields = ['title', 'description', 'project__name']
    
    fieldsets = (
        ('Informations du jalon', {
            'fields': ('title', 'description', 'project')
        }),
        ('Planning', {
            'fields': ('date', 'status')
        })
    )
