# Generated by Django 3.2.4 on 2021-07-26 06:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0006_document_created_at'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='document',
            options={'ordering': ['created_at']},
        ),
        migrations.AddField(
            model_name='audit',
            name='is_open',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name='integration',
            name='type',
            field=models.CharField(choices=[('ARC_GIS', 'Esri ArcGIS'), ('DOCU_SIGN', 'Docu Sign')], max_length=64),
        ),
    ]
