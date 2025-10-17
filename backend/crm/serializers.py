from rest_framework import serializers
from .models import Client, Quote, QuoteItem, Communication

class ClientSerializer(serializers.ModelSerializer):
    total_projects = serializers.IntegerField(read_only=True, default=0)
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, default=0)
    
    class Meta:
        model = Client
        fields = '__all__'

class QuoteItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'total']
        read_only_fields = ['total']

class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True, required=False)
    client_name = serializers.CharField(source='client.name', read_only=True)
    
    class Meta:
        model = Quote
        fields = '__all__'
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        quote = Quote.objects.create(**validated_data)
        for item_data in items_data:
            QuoteItem.objects.create(quote=quote, **item_data)
        return quote

class CommunicationSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Communication
        fields = '__all__'
