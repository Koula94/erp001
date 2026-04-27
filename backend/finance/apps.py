from django.apps import AppConfig


class FinanceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'finance'
    verbose_name = 'Finance'
    
    def ready(self):
        # Import des signaux pour la synchronisation automatique
        import finance.signals
