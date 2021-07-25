import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser


class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_org_admin = models.BooleanField(default=True)


# audit: user, arcgis map id, envelop id

# reviewer: name, email, audit, needs_to_sign

# review_history: reviewer, document, audit, status

# signable ??? : audit, url, tabs (json)

# notification: user, review_history

class Document(models.Model): # exported from map id
    map_id = models.CharField(max_length=200) # arcjs map id
    title = models.CharField(max_length=200)
    url = models.CharField(max_length=200)
    map_item = models.TextField() # arcgis item
    map_item_data = models.TextField() # arcgis item data
    # audit


class Comment(models.Model):
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

