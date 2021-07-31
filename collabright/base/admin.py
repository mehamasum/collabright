from django.contrib import admin
from .models import (
    Notification, User, Organization, Document, Comment, Integration, Audit, Contact, Reviewer)


admin.site.register(User)
admin.site.register(Organization)
admin.site.register(Document)
admin.site.register(Comment)
admin.site.register(Integration)
admin.site.register(Audit)
admin.site.register(Contact)
admin.site.register(Reviewer)
admin.site.register(Notification)
