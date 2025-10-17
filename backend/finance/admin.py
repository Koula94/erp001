from django.contrib import admin
from .models import Invoice, InvoiceItem, Expense, Budget

class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'client', 'amount', 'status', 'issue_date', 'due_date']
    list_filter = ['status']
    inlines = [InvoiceItemInline]

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['category', 'amount', 'project', 'status', 'date', 'submitted_by']
    list_filter = ['status', 'category']

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['category', 'project', 'department', 'planned_amount', 'spent_amount', 'period_start', 'period_end']
