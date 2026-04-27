# Generated manually - Ajout du champ quote pour les devis

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0012_remove_category_subcategory_from_operationrequest'),
    ]

    operations = [
        migrations.AddField(
            model_name='operationrequest',
            name='quote',
            field=models.FileField(blank=True, null=True, upload_to='operation_quotes/'),
        ),
    ]
