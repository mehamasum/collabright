from django.conf import settings
from rest_framework import permissions
from .models import Document, Reviewer, Audit
from .utils import hash_is_valid


class IsDocuSignWebHookRequest(permissions.BasePermission):
    def has_permission(self, request, view):
        headers = request.headers
        body = request.body
        auth_type = headers.get('X-Authorization-Digest', None)

        return auth_type == 'HMACSHA256' and hash_is_valid(
            settings.DOCUSIGN_WEBHOOK_HMAC.encode('utf-8'), body,
            headers['X-Docusign-Signature-1'].encode('utf-8'))

class IsAuditReviewer(permissions.BasePermission):
  def has_object_permission(self, request, view, audit):
    token = request.query_params.get('token')
    try:
      reviewer = Reviewer.objects.get(token=token, audit=audit)
      return True
    except Reviewer.DoesNotExist:
      return False

class IsDocumentReviewer(permissions.BasePermission):
  def has_object_permission(self, request, view, document):
    token = request.query_params.get('token')
    try:
      reviewer = Reviewer.objects.get(token=token, audit=document.audit)
      print('reviewer', reviewer)
      return True
    except Reviewer.DoesNotExist:
      return False

class IsCommentReviewer(permissions.BasePermission):
  def has_permission(self, request, view):
    if view.action != 'list':
      return True

    token = request.query_params.get('token')
    document_id = request.query_params.get('document')
    
    try:
      document = Document.objects.get(id=document_id)
    except Document.DoesNotExist:
      return False

    try:
      reviewer = Reviewer.objects.get(token=token, audit=document.audit)
      return True
    except Reviewer.DoesNotExist:
      return False

  def has_object_permission(self, request, view, comment):
    token = request.query_params.get('token')
    try:
      reviewer = Reviewer.objects.get(token=token, audit=comment.document.audit)
      return True
    except Reviewer.DoesNotExist:
      return False

class IsOrgAdmin(permissions.BasePermission):
  def has_object_permission(self, request, view, organization):
    return request.user.organization and request.user.organization.id == organization.id and request.user.is_org_admin
