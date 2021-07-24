from django.contrib.auth.models import Group
from django.conf import settings
from rest_framework import viewsets
from rest_framework import permissions
from .serializers import (DocumentSerializer, CommentSerializer)
from .models import (Comment, Document, )

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    permission_classes = (permissions.IsAuthenticated, )
    serializer_class = DocumentSerializer

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    permission_classes = (permissions.IsAuthenticated, )
    serializer_class = CommentSerializer