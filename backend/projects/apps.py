from django.apps import AppConfig


class ProjectsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'projects'
    verbose_name = 'Projets'

    def ready(self):
        # Import des signaux pour la synchronisation automatique
        import projects.signals
