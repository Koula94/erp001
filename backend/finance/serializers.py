from rest_framework import serializers
from .models import Invoice, InvoiceItem, Expense, Budget, OperationRequest

class InvoiceItemSerializer(serializers.ModelSerializer):
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'total']
        read_only_fields = ['total']

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, required=False)
    client_name = serializers.CharField(source='client.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        invoice = Invoice.objects.create(**validated_data)
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        return invoice
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        
        # Update invoice fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update or create invoice items
        if items_data:
            # Clear existing items
            instance.items.all().delete()
            
            # Create new items
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=instance, **item_data)
        
        return instance

class ExpenseSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = Expense
        fields = '__all__'

class BudgetSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    remaining = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Budget
        fields = '__all__'

class OperationRequestSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    requester_name = serializers.CharField(source='requester.get_full_name', read_only=True)
    validated_by_name = serializers.CharField(source='validated_by.get_full_name', read_only=True)
    workflow_status = serializers.CharField(source='get_workflow_status', read_only=True)
    
    class Meta:
        model = OperationRequest
        fields = '__all__'
        read_only_fields = ['reference', 'request_date', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validation personnalisée pour les demandes d'opération"""
        # Vérifier que le nom de tâche est fourni
        if 'task_name' in data and not data['task_name'].strip():
            raise serializers.ValidationError({"task_name": "Le nom de la tâche est obligatoire"})
        
        # Vérifier que le montant est positif
        if 'total_amount' in data and data['total_amount'] <= 0:
            raise serializers.ValidationError({"total_amount": "Le montant doit être supérieur à 0"})
        
        return data
    
    def create(self, validated_data):
        """Création d'une demande d'opération avec l'utilisateur connecté comme demandeur"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['requester'] = request.user
        
        return super().create(validated_data)
