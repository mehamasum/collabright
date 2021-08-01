from django.db.models.signals import post_save
from .service import DocuSignOAuthService, DocuSignService
from .models import Audit


def create_docusign_envelope(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        token = DocuSignOAuthService.get_access_token(user)
        envelope = DocuSignService.create_envelope({
            'access_token': token,
            'signers': [],
            'documents': []
        });
        envelope_id = envelope.get('envelope_id', None)
        Audit.objects.filter(id=instance.id).update(envelope_id=envelope_id)


def add_docusign_document_to_envelope(sender, instance, created, **kwargs):
    if not created and bool(instance.file):
        user = instance.audit.user
        envelope_id = str(instance.audit.envelope_id)
        token = DocuSignOAuthService.get_access_token(user)
        file_path = instance.file.path
        document = DocuSignService.update_document({
            'access_token': token,
            'envelope_id': envelope_id,
            'documents': [{
                'file_path': file_path,
                'document_id': 1
            }]
        })
        print(document)
