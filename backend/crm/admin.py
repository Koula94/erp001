from django.contrib import admin
from .models import Client, Quote, QuoteItem, Communication

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'status', 'contact_person', 'created_at']
    list_filter = ['status']
    search_fields = ['name', 'email', 'contact_person']

class QuoteItemInline(admin.TabularInline):
    model = QuoteItem
    extra = 1

@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'project_name', 'amount', 'status', 'created_at']
    list_filter = ['status']
    inlines = [QuoteItemInline]

@admin.register(Communication)
class CommunicationAdmin(admin.ModelAdmin):
    list_display = ['client', 'type', 'subject', 'date', 'user']
    list_filter = ['type']
