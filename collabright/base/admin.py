from django.contrib import admin
from .models import (
    User, Organization, Document, Comment, Integration)


admin.site.register(User)
admin.site.register(Organization)
admin.site.register(Document)
admin.site.register(Comment)
admin.site.register(Integration)
