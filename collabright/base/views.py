import json
from django.contrib.auth.models import Group
from rest_framework import viewsets
from rest_framework import permissions
from .serializers import (DocumentSerializer, CommentSerializer, IntegrationSerializer, AuditSerializer, ContactSerializer, ReviewerSerializer)
from .models import (Comment, Document, Integration, Audit, Contact, Reviewer)
from .service import (ArcGISOAuthService, DocuSignOAuthService, get_document_from_audit_version, download_and_save_file)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
from rest_framework import filters

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().order_by('created_at')
    permission_classes = (permissions.IsAuthenticated, )
    serializer_class = DocumentSerializer

class CommentViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated, )
    serializer_class = CommentSerializer

    def get_queryset(self):
        queryset = Comment.objects.all().order_by('id')
        document = self.request.query_params.get('document')
        if document is not None:
            queryset = queryset.filter(document=document)
        return queryset

class IntegrationViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated, )
    serializer_class = IntegrationSerializer

    def get_queryset(self):
        return Integration.objects.filter(user=self.request.user).order_by('id')

class AuditViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated, )
    serializer_class = AuditSerializer

    def get_queryset(self):
        return Audit.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def add_reviewers(self, request, pk=None):
        audit = self.get_object()
        reviewers = []
        for reviewer in request.data:
            email = reviewer['email']
            needs_to_sign = reviewer['needs_to_sign'] or False
            if not email:
                continue
            (contact, _) = Contact.objects.get_or_create(email=email, created_by=self.request.user)
            (reviewer, _) = Reviewer.objects.update_or_create(
                contact=contact,
                audit=audit,
                defaults={'needs_to_sign': needs_to_sign},
            )
            print('reviewer', reviewer)
            reviewers.append(reviewer)
        reviewer_serializer = ReviewerSerializer(reviewers, many=True)
        return Response(reviewer_serializer.data)

class ContactViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated, )
    serializer_class = ContactSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email']

    def get_queryset(self):
        return Contact.objects.filter(created_by=self.request.user).order_by('-created_at')

class ArcGISApiViewSet(viewsets.ViewSet):
    permission_classes = (permissions.IsAuthenticated, )

    @action(detail=False)
    def oauth_url(self, request):
        url = ArcGISOAuthService.get_oauth_url()
        return Response({
            'url': url
        })

    @action(detail=False, methods=['post'])
    def verify_oauth(self, request):
        code = request.data.get('code')
        if ArcGISOAuthService.verify_oauth(code, request.user):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_400_BAD_REQUEST)


    @action(detail=False)
    def get_map(self, request):
        audit_id = request.query_params.get('audit_id')
        version = int(request.query_params.get('version'))
        
        document = get_document_from_audit_version(audit_id, version)
        
        info = {
          'item': json.loads(document.map_item),
          'itemData': json.loads(document.map_item_data)
        }
        return Response(data=info)

    @action(detail=False, methods=['post'])
    def update_map_print_definition(self, request):
        audit_id = request.query_params.get('audit_id')
        version = int(request.query_params.get('version'))
        map_print_definition = request.data.get('map_print_definition')

        document = get_document_from_audit_version(audit_id, version)

        if not document.map_print_definition:
            document.map_print_definition = map_print_definition
            document.save()

        if not document.file:
            response = ArcGISOAuthService.export_map_as_file(
                document.map_print_definition,
                document.map_item,
                document.map_item_data,
                'Map (v{0}.0)'.format(version)
            )
            file_url = response['results'][0]['value']['url']
            download_and_save_file(file_url, audit_id, version, document)
        return Response(data={'ok': True}, status=status.HTTP_200_OK)

class DocuSignApiViewSet(viewsets.ViewSet):
    permission_classes = (permissions.IsAuthenticated, )

    @action(detail=False)
    def oauth_url(self, request):
        url = DocuSignOAuthService.get_oauth_url()
        return Response({
            'url': url
        })

    @action(detail=False, methods=['post'])
    def verify_oauth(self, request):
        code = request.data.get('code')
        if DocuSignOAuthService.verify_oauth(code, request.user):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_400_BAD_REQUEST)
        