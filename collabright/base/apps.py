from django.apps import AppConfig
from django.db.models.signals import post_save


class BaseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'collabright.base'

    def ready(self):
        from .models import (Audit, Document,)
        from .signals import (create_docusign_envelope,
                              add_docusign_document_to_envelope,)

        post_save.connect(create_docusign_envelope, Audit,
                          dispatch_uid='create_docusign_envelope')
        post_save.connect(add_docusign_document_to_envelope, Document,
                          dispatch_uid='add_docusign_document_to_envelope')
