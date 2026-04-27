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
    linked_disbursement_reference = serializers.CharField(source='linked_disbursement.description', read_only=True)
    receipt_url = serializers.SerializerMethodField()
    
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
            'receipt': {'write_only': True},
        }
    
    def get_receipt_url(self, obj):
        """Retourne l'URL complète du reçu/justificatif"""
        if obj.receipt and hasattr(obj.receipt, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.receipt.url)
            return obj.receipt.url
        return None
    
    def to_representation(self, instance):
        """Surcharge pour que project soit un objet {id, name} au lieu d'un simple ID"""
        representation = super().to_representation(instance)
        if instance.project:
            representation['project'] = {
                'id': str(instance.project.id),
                'name': instance.project.name
            }
        else:
            representation['project'] = None
        return representation
    
    def validate_subcategories(self, value):
        """Validation personnalisée pour le champ subcategories"""
        import json
        
        if value is None:
            return []
        
        # Si c'est une chaîne JSON (venant de FormData), la parser
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except (json.JSONDecodeError, TypeError):
                raise serializers.ValidationError("Le champ subcategories doit être une liste JSON valide")
        
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
    payment_proof_url = serializers.SerializerMethodField()
    quote_url = serializers.SerializerMethodField()
    
    class Meta:
        model = OperationRequest
        fields = '__all__'
        read_only_fields = ['reference', 'request_date', 'created_at', 'updated_at']
        extra_kwargs = {
            'payment_proof': {'write_only': True},
            'quote': {'write_only': True},
        }
    
    def get_payment_proof_url(self, obj):
        """Retourne l'URL complète du justificatif de paiement"""
        if obj.payment_proof and hasattr(obj.payment_proof, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.payment_proof.url)
            return obj.payment_proof.url
        return None
    
    def get_quote_url(self, obj):
        """Retourne l'URL complète du devis joint"""
        if obj.quote and hasattr(obj.quote, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.quote.url)
            return obj.quote.url
        return None
    
    def to_representation(self, instance):
        """Surcharge pour que project et requester soient des objets au lieu de simples IDs"""
        representation = super().to_representation(instance)
        
        # Projet en objet {id, name}
        if instance.project:
            representation['project'] = {
                'id': str(instance.project.id),
                'name': instance.project.name
            }
        else:
            representation['project'] = None
        
        # Requester en objet {id, name}
        if instance.requester:
            representation['requester'] = {
                'id': str(instance.requester.id),
                'name': instance.requester.get_full_name() or instance.requester.username
            }
        else:
            representation['requester'] = None
        
        # Validated_by en objet {id, name}
        if instance.validated_by:
            representation['validated_by'] = {
                'id': str(instance.validated_by.id),
                'name': instance.validated_by.get_full_name() or instance.validated_by.username
            }
        else:
            representation['validated_by'] = None
        
        return representation
    
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


