from rest_framework import permissions
from .models import Reviewer

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