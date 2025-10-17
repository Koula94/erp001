from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, QuoteViewSet, CommunicationViewSet

router = DefaultRouter()
router.register(r'clients', ClientViewSet)
router.register(r'quotes', QuoteViewSet)
router.register(r'communications', CommunicationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
