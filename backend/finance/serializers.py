from rest_framework import serializers
from .models import Invoice, InvoiceItem, Expense, Budget, OperationRequest, OperationSubcategory

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
    linked_disbursement_reference = serializers.CharField(source='linked_disbursement.description', read_only=True)
    
    class Meta:
        model = Expense
        fields = '__all__'
        extra_kwargs = {
            'project': {'required': False, 'allow_null': True},
            'subcategory': {'required': False, 'allow_blank': True},
            'subcategories': {'required': False, 'allow_null': True},
            'fund_source': {'required': False, 'allow_blank': True},
            'linked_disbursement': {'required': False, 'allow_null': True},
            'cash_withdrawal_date': {'required': False, 'allow_null': True},
        }
    
    def validate_subcategories(self, value):
        """Validation personnalisée pour le champ subcategories"""
        if value is None:
            return []
        
        if not isinstance(value, list):
            raise serializers.ValidationError("Le champ subcategories doit être une liste")
        
        # Valider chaque élément de la liste
        for i, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(f"L'élément {i} de subcategories doit être un objet")
            
            if 'name' not in item or not item['name']:
                raise serializers.ValidationError(f"L'élément {i} doit avoir un champ 'name' non vide")
            
            if 'amount' not in item or not isinstance(item['amount'], (int, float)):
                raise serializers.ValidationError(f"L'élément {i} doit avoir un champ 'amount' numérique")
            
            if item['amount'] < 0:
                raise serializers.ValidationError(f"Le montant de l'élément {i} ne peut pas être négatif")
        
        return value
    
    def create(self, validated_data):
        """Création d'une dépense avec gestion du champ project"""
        # Récupérer l'utilisateur connecté comme soumissionnaire
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['submitted_by'] = request.user
        
        # S'assurer que subcategories est une liste
        if 'subcategories' not in validated_data:
            validated_data['subcategories'] = []
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Mise à jour d'une dépense"""
        # Récupérer l'utilisateur connecté
        request = self.context.get('request')
        
        # Mettre à jour les champs
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

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
    payment_proof_url = serializers.FileField(source='payment_proof', read_only=True)
    
    class Meta:
        model = OperationRequest
        fields = '__all__'
        read_only_fields = ['reference', 'request_date', 'created_at', 'updated_at']
        extra_kwargs = {
            'category': {'required': False, 'allow_blank': True},
            'subcategory': {'required': False, 'allow_blank': True},
        }
    
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


class OperationSubcategorySerializer(serializers.ModelSerializer):
    """Sérialiseur pour les sous-catégories d'opération"""
    class Meta:
        model = OperationSubcategory
        fields = ['id', 'name', 'amount', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class OperationRequestWithSubcategoriesSerializer(serializers.ModelSerializer):
    """Sérialiseur pour OperationRequest avec sous-catégories imbriquées"""
    project_name = serializers.CharField(source='project.name', read_only=True)
    requester_name = serializers.CharField(source='requester.get_full_name', read_only=True)
    validated_by_name = serializers.CharField(source='validated_by.get_full_name', read_only=True)
    workflow_status = serializers.CharField(source='get_workflow_status', read_only=True)
    payment_proof_url = serializers.FileField(source='payment_proof', read_only=True)
    subcategories = OperationSubcategorySerializer(many=True, required=False)
    
    class Meta:
        model = OperationRequest
        fields = '__all__'
        read_only_fields = ['reference', 'request_date', 'created_at', 'updated_at']
        extra_kwargs = {
            'category': {'required': False, 'allow_blank': True},
            'subcategory': {'required': False, 'allow_blank': True},
        }
    
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
        """Création d'une demande d'opération avec sous-catégories"""
        subcategories_data = validated_data.pop('subcategories', [])
        request = self.context.get('request')
        
        if request and request.user.is_authenticated:
            validated_data['requester'] = request.user
        
        # Créer l'opération
        operation = OperationRequest.objects.create(**validated_data)
        
        # Créer les sous-catégories
        for subcategory_data in subcategories_data:
            OperationSubcategory.objects.create(
                operation_request=operation,
                **subcategory_data
            )
        
        return operation
    
    def update(self, instance, validated_data):
        """Mise à jour d'une demande d'opération avec sous-catégories"""
        subcategories_data = validated_data.pop('subcategories', [])
        
        # Mettre à jour les champs de l'opération
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Mettre à jour les sous-catégories
        if subcategories_data:
            # Supprimer les anciennes sous-catégories
            instance.subcategories.all().delete()
            
            # Créer les nouvelles sous-catégories
            for subcategory_data in subcategories_data:
                OperationSubcategory.objects.create(
                    operation_request=instance,
                    **subcategory_data
                )
        
        return instance
