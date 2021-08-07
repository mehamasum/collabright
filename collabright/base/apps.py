from django.apps import AppConfig
from django.db.models.signals import post_save


class BaseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'collabright.base'

    def ready(self):
        from .models import (Audit, Document,)
        from .signals import (create_docusign_envelope,
                              export_map_as_pdf)

        post_save.connect(create_docusign_envelope, Audit,
                          dispatch_uid='create_docusign_envelope')
        post_save.connect(export_map_as_pdf, Document,
                          dispatch_uid='export_map_as_pdf')
