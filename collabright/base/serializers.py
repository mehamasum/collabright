from django.contrib.auth.models import Group
from rest_framework import serializers
from .models import (Document, Comment, Integration)

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ('id', 'title', 'url',)

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ('id', 'document', 'annotation', 'xfdf')

class IntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Integration
        fields = ('id', 'type', 'expiry_date', 'refresh_expiry_date')