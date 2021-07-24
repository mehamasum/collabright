from django.contrib.auth.models import Group
from rest_framework import serializers
from .models import (Document, Comment)

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ('id', 'title', 'url',)

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ('id', 'document', 'annotation', 'xfdf')