import json
from django.conf import settings
from django.contrib.auth.models import Group
from rest_framework import viewsets
from rest_framework import permissions
from .serializers import (DocumentSerializer, CommentSerializer, IntegrationSerializer, AuditSerializer, ContactSerializer, NotificationSerializer, ReviewerSerializer, DocumentMapSerializer)
from .models import (Comment, Document, Integration, Audit, Contact, Notification, Reviewer)
from .service import (ArcGISOAuthService, DocuSignOAuthService, get_document_from_audit_version, download_and_save_file, send_email_to_requester, send_email_to_reviewer, send_notification_to_requester)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
from rest_framework import filters
from collabright.base.permissions import IsAuditReviewer, IsCommentReviewer, IsDocumentReviewer
from django.shortcuts import get_object_or_404
from django.utils import timezone

def has_review_token(request):
    token = request.query_params.get('token')
    return True if token else False
class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().order_by('created_at')
    permission_classes = (permissions.IsAuthenticated, )
    serializer_class = DocumentSerializer

    _created_document = None

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DocumentMapSerializer
        return super().get_serializer_class()

    def get_permissions(self):
        if has_review_token(self.request) and self.action == 'retrieve':
            permission_classes = [IsDocumentReviewer]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        self._created_document = serializer.save()

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        document = self._created_document
        user = self.request.user
        version = Document.objects.filter(audit=document.audit).count()
        reviewers = Reviewer.objects.filter(audit=document.audit)
        for reviewer in reviewers:
            send_email_to_reviewer(user, document.audit, reviewer, version)
        return response

class CommentViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated, )
    serializer_class = CommentSerializer

    def get_queryset(self):
        queryset = Comment.objects.all().order_by('id')
        document = self.request.query_params.get('document') or self.request.data.get('document')
        if document:
            return queryset.filter(document=document)
        return queryset

    def get_permissions(self):
        permission_classes = [permissions.IsAuthenticated]
        if has_review_token(self.request):
            permission_classes = [IsCommentReviewer]
        else:
            permission_classes = [permissions.IsAuthenticated]
        print(permission_classes)
        return [permission() for permission in permission_classes]

class IntegrationViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated, )
    serializer_class = IntegrationSerializer

    def get_queryset(self):
        return Integration.objects.filter(user=self.request.user).order_by('id')

class AuditViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated, )
    serializer_class = AuditSerializer

    def get_queryset(self):
        queryset = Audit.objects.all().order_by('-created_at')
        if has_review_token(self.request):
            return queryset # TODO: fix me
        return queryset.filter(user=self.request.user)

    def get_permissions(self):
        if has_review_token(self.request) and self.action in ['retrieve', 'me', 'approve', 'disapprove']:
            permission_classes = [IsAuditReviewer]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['post'])
    def add_reviewers(self, request, pk=None):
        user = self.request.user
        audit = self.get_object()
        reviewers = []
        for reviewer in request.data:
            email = reviewer['email']
            needs_to_sign = reviewer['needs_to_sign'] or False
            if not email:
                continue
            (contact, _) = Contact.objects.get_or_create(email=email, created_by=self.request.user)
            (reviewer, created) = Reviewer.objects.update_or_create(
                contact=contact,
                audit=audit,
                defaults={'needs_to_sign': needs_to_sign},
            )
            if created:
                send_email_to_reviewer(user, audit, reviewer, 1)
            reviewers.append(reviewer)
        
        
        reviewer_serializer = ReviewerSerializer(reviewers, many=True)
        return Response(reviewer_serializer.data)

    def get_reviewer(self, request):
        audit = self.get_object()
        token = request.query_params.get('token')
        return get_object_or_404(Reviewer, token=token, audit=audit)

    @action(detail=True)
    def me(self, request, pk=None):
        reviewer = self.get_reviewer(request)
        reviewer_serializer = ReviewerSerializer(reviewer)
        return Response(reviewer_serializer.data)

    @action(detail=True, methods=['post'])
    def verdict(self, request, pk=None):
        verdict = request.data['verdict']
        if verdict not in [Reviewer.APPROVED, Reviewer.REQUESTED_CHANGE]:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        reviewer = self.get_reviewer(request)
        reviewer.verdict = verdict
        reviewer.save()

        if reviewer.audit.user.email:
            send_email_to_requester(reviewer.audit.user, reviewer.audit, reviewer, verdict)
        send_notification_to_requester(reviewer.audit.user, reviewer.audit, reviewer, Notification.REVIEW)
        
        reviewer_serializer = ReviewerSerializer(reviewer)
        return Response(reviewer_serializer.data)


class ContactViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated, )
    serializer_class = ContactSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email']

    def get_queryset(self):
        return Contact.objects.filter(created_by=self.request.user).order_by('-created_at')

class NotificationViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated, )
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.read_at = timezone.now()
        notification.save()

        serializer = NotificationSerializer(notification)
        return Response(serializer.data)

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
        