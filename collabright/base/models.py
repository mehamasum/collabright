import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
import secrets

class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    gis_base_url = models.CharField(max_length=200, null=True, blank=True)

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_org_admin = models.BooleanField(default=True)

class Contact(models.Model):
    email = models.EmailField()
    name = models.CharField(max_length=200, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['email', 'created_by']]

    def save(self, *args, **kwargs):
        if not self.name:
            self.name = self.email.split("@")[0]
        super(Contact, self).save(*args, **kwargs)

def get_agreement_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/<audit_id>/<filename>
    return '{0}/agreement_{1}'.format(instance.id, filename)
class Audit(models.Model):
    CREATED = 'created'
    SENT = 'sent'
    STATUS_CHOICES = (
        (CREATED, 'Created'),
        (SENT, 'Sent'),)

    title = models.CharField(max_length=200)
    description = models.CharField(max_length=1024, null=True, blank=True)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    envelope_id = models.UUIDField(null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    map_url = models.CharField(max_length=512) # arcjs web map url
    base_url = models.CharField(max_length=200) # arcjs url from map_url
    map_id = models.CharField(max_length=200) # arcjs map id from map_url
    created_at = models.DateTimeField(auto_now_add=True)
    is_open = models.BooleanField(default=True)
    agreement = models.FileField(null=True, blank=True, upload_to=get_agreement_directory_path)
    status = models.CharField(
        choices=STATUS_CHOICES, max_length=64, default=CREATED)

def get_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/<audit_id>/<filename>
    return '{0}/{1}'.format(instance.audit.id, filename)
class Document(models.Model): # exported from map id
    description = models.CharField(max_length=1024, null=True, blank=True)
    map_item = models.TextField() # arcgis item
    map_item_data = models.TextField() # arcgis item data
    map_print_definition = models.TextField(null=True, blank=True) # arcgis Web_Map_as_JSON
    audit = models.ForeignKey(Audit, on_delete=models.CASCADE, related_name='documents')
    created_at = models.DateTimeField(auto_now_add=True)
    file = models.FileField(blank=True, upload_to=get_directory_path)
    class Meta:
        ordering = ['created_at']


def make_token():
    return secrets.token_urlsafe(128)

class Reviewer(models.Model):
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REQUESTED_CHANGE = 'REQUESTED_CHANGES'
    TYPE_CHOICES = (
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (REQUESTED_CHANGE, 'Requested change'),
    )

    contact = models.ForeignKey(Contact, on_delete=models.CASCADE)
    audit = models.ForeignKey(Audit, on_delete=models.CASCADE, related_name='reviewers')
    needs_to_sign = models.BooleanField(default=False)
    has_signed = models.BooleanField(default=False)
    verdict = models.CharField(choices=TYPE_CHOICES, max_length=64, default=PENDING)
    token = models.CharField(max_length=1024, default=make_token)

class Notification(models.Model):
    REVIEW = 'REVIEW'
    COMMENT = 'COMMENT'
    SIGNED = 'SIGNED'
    TYPE_CHOICES = (
        (REVIEW, 'Review'),
        (COMMENT, 'Comment'),
        (SIGNED, 'Signed'),
    )
    type = models.CharField(choices=TYPE_CHOICES, max_length=64, default=REVIEW)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    audit = models.ForeignKey(Audit, on_delete=models.CASCADE)
    reviewer = models.ForeignKey(Reviewer, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True)
    payload = models.TextField(null=True, blank=True)
    class Meta:
        ordering = ['created_at']


class Comment(models.Model):
    # TODO: ref user/reviewer
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='comments')
    annotation = models.CharField(max_length=200)
    xfdf = models.TextField()

class Integration(models.Model):
    ARC_GIS = 'ARC_GIS'
    DOCU_SIGN = 'DOCU_SIGN'
    TYPE_CHOICES = (
        (ARC_GIS, 'Esri ArcGIS'),
        (DOCU_SIGN, 'Docu Sign'),
    )

    type = models.CharField(choices=TYPE_CHOICES, max_length=64)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    data = models.TextField() # dump
    access_token = models.CharField(max_length=1024)
    expiry_date = models.DateTimeField()
    refresh_token = models.CharField(max_length=1024)
    refresh_expiry_date = models.DateTimeField()

