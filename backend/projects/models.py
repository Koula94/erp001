from django.db import models
from django.db.models import Count, Q
from users.models import User
from crm.models import Client

class Project(models.Model):
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('in-progress', 'In Progress'),
        ('on-hold', 'On Hold'),
        ('completed', 'Completed'),
    ]
    
    name = models.CharField(max_length=200)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='projects')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    progress = models.IntegerField(default=0)
    start_date = models.DateField()
    end_date = models.DateField()
    budget = models.DecimalField(max_digits=12, decimal_places=2)
    spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='managed_projects')
    team = models.ManyToManyField(User, related_name='projects', blank=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    def calculate_progress_from_tasks(self):
        """Calcule la progression automatique basée sur les tâches.
        
        Utilise le champ 'progress' individuel de chaque tâche (0-100%) pondéré
        par la priorité. Si une tâche est 'completed', elle compte pour 100%
        quelle que soit sa valeur de progress. Si elle est 'pending', elle
        contribue à 0% sauf si un progress > 0 a été explicitement défini.
        """
        tasks = self.tasks.all()
        
        if not tasks.exists():
            return 0
        
        # Pondération par priorité
        priority_weights = {
            'high': 3,
            'medium': 2,
            'low': 1
        }
        
        total_weight = 0
        weighted_sum = 0
        
        for task in tasks:
            weight = priority_weights.get(task.priority, 1)
            total_weight += weight
            
            # Déterminer la progression effective de la tâche
            if task.status == 'completed':
                # Une tâche terminée = 100% quelle que soit la valeur stored
                task_progress = 100
            elif task.status == 'pending':
                # Tâche en attente : utiliser 0 (ignorer un éventuel progress résiduel)
                task_progress = 0
            else:
                # Tâche en cours : utiliser la valeur réelle de progress (0-100)
                task_progress = task.progress if task.progress is not None else 0
            
            weighted_sum += weight * task_progress
        
        if total_weight == 0:
            return 0
        
        return round(weighted_sum / total_weight)
    
    def get_auto_status(self, progress):
        """Détermine automatiquement le statut basé sur la progression avec règles de cohérence"""
        # Règles de cohérence progression/statut
        if progress == 100:
            return 'completed'
        elif progress >= 90:
            # Si progression >= 90%, forcer le statut "completed" pour éviter les incohérences
            return 'completed'
        elif progress >= 10:
            return 'in-progress'
        else:
            return 'planning'
    
    def validate_status_progress_consistency(self):
        """Valide la cohérence entre le statut et la progression actuelle"""
        status_rules = {
            'planning': {'min': 0, 'max': 10},
            'in-progress': {'min': 10, 'max': 90},
            'completed': {'min': 90, 'max': 100},
            'on-hold': {'min': 0, 'max': 100}  # Statut spécial sans restriction
        }
        
        rule = status_rules.get(self.status, {'min': 0, 'max': 100})
        return rule['min'] <= self.progress <= rule['max']
    
    def sync_with_tasks(self):
        """Synchronise automatiquement le projet avec ses tâches et corrige les incohérences"""
        real_progress = self.calculate_progress_from_tasks()
        auto_status = self.get_auto_status(real_progress)
        
        # Vérifier si le statut actuel est cohérent avec la progression
        is_current_status_consistent = self.validate_status_progress_consistency()
        
        # Mettre à jour la progression si nécessaire
        progress_changed = self.progress != real_progress
        if progress_changed:
            self.progress = real_progress
        
        # Déterminer si le statut doit être mis à jour
        status_changed = False
        
        # Si le statut actuel est incohérent, forcer la correction
        if not is_current_status_consistent:
            self.status = auto_status
            status_changed = True
        # Sinon, appliquer les transitions normales
        elif self.status != auto_status:
            # Vérifier les transitions autorisées
            allowed_transitions = {
                'planning': ['in-progress', 'on-hold'],
                'in-progress': ['completed', 'on-hold'],
                'on-hold': ['in-progress', 'planning'],
                'completed': []
            }
            
            if auto_status in allowed_transitions.get(self.status, []):
                self.status = auto_status
                status_changed = True
        
        return {
            'progress_changed': progress_changed,
            'status_changed': status_changed,
            'new_progress': real_progress,
            'new_status': auto_status,
            'was_inconsistent': not is_current_status_consistent
        }
    
    def get_critical_tasks(self):
        """Retourne les tâches critiques du projet"""
        from django.utils import timezone
        
        today = timezone.now().date()
        critical_tasks = []
        
        for task in self.tasks.all():
            is_critical = (
                (task.priority == 'high' and task.status != 'completed') or
                (task.end_date and task.end_date < today and task.status != 'completed') or
                (task.status == 'in-progress' and task.progress == 0)
            )
            
            if is_critical:
                critical_tasks.append(task)
        
        return critical_tasks
    
    def get_risk_level(self):
        """Évalue le niveau de risque du projet"""
        critical_tasks = self.get_critical_tasks()
        total_tasks = self.tasks.count()
        
        if total_tasks == 0:
            return 'low'
        
        critical_percentage = (len(critical_tasks) / total_tasks) * 100
        
        if critical_percentage > 30 or len(critical_tasks) >= 3:
            return 'high'
        elif critical_percentage > 10 or len(critical_tasks) >= 1:
            return 'medium'
        else:
            return 'low'
    
    def calculate_spent_from_finance(self):
        """Calcule automatiquement le montant dépensé basé sur les données finance.
        
        Logique:
        - Le budget du projet (project.budget) est utilisé par les opérations
        - Quand une opération est payée, elle déduit du budget projet
        - Les dépenses sont prélevées sur la caisse des opérations, PAS sur le budget projet
        """
        try:
            from finance.models import OperationRequest
            
            # Somme des opérations payées liées au projet (ce qui a été réellement décaissé)
            paid_operations = OperationRequest.objects.filter(
                project=self,
                status='paid'
            ).aggregate(total=models.Sum('total_amount'))['total'] or 0
            
            # Total dépensé = opérations payées (seules les opérations impactent le budget projet)
            total_spent = paid_operations
            
            return total_spent
            
        except Exception as e:
            print(f"Erreur lors du calcul des dépenses: {e}")
            return self.spent  # Retourner la valeur actuelle en cas d'erreur
    
    def sync_with_finance(self):
        """Synchronise automatiquement le budget du projet avec les données finance"""
        real_spent = self.calculate_spent_from_finance()
        budget_used = (real_spent / self.budget) * 100 if self.budget > 0 else 0
        
        # Mettre à jour si nécessaire
        spent_changed = self.spent != real_spent
        if spent_changed:
            self.spent = real_spent
        
        return {
            'spent_changed': spent_changed,
            'new_spent': real_spent,
            'budget_used_percentage': budget_used,
            'budget_status': self.get_budget_status()
        }
    
    def get_budget_status(self):
        """Retourne le statut du budget"""
        if self.budget == 0:
            return 'no-budget'
        
        budget_used = (self.spent / self.budget) * 100
        
        if budget_used <= 80:
            return 'under-budget'
        elif budget_used <= 100:
            return 'on-budget'
        else:
            return 'over-budget'
    
    def get_budget_risk_level(self):
        """Évalue le niveau de risque budgétaire"""
        budget_status = self.get_budget_status()
        
        if budget_status == 'over-budget':
            return 'high'
        elif budget_status == 'on-budget':
            return 'medium'
        else:
            return 'low'
    
    def get_overall_risk_level(self):
        """Évalue le niveau de risque global (tâches + budget)"""
        task_risk = self.get_risk_level()
        budget_risk = self.get_budget_risk_level()
        
        # Priorité au risque le plus élevé
        risk_weights = {
            'high': 3,
            'medium': 2,
            'low': 1
        }
        
        task_weight = risk_weights.get(task_risk, 1)
        budget_weight = risk_weights.get(budget_risk, 1)
        
        max_weight = max(task_weight, budget_weight)
        
        if max_weight == 3:
            return 'high'
        elif max_weight == 2:
            return 'medium'
        else:
            return 'low'

class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in-progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_tasks')
    start_date = models.DateField()
    end_date = models.DateField()
    progress = models.IntegerField(default=0)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.project.name} - {self.title}"

class Milestone(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in-progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=200)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    description = models.TextField()
    
    def __str__(self):
        return f"{self.project.name} - {self.title}"
