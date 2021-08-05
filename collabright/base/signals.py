from django.db.models.signals import post_save
from .service import DocuSignOAuthService, DocuSignService, ArcGISOAuthService
from .models import Audit, Document
from .tasks import download_and_save_file

# on audit
def create_docusign_envelope(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        token = DocuSignOAuthService.get_access_token(user)
        envelope = DocuSignService.create_envelope({
            'email_subject': 'Please sign the agreement from Collabright - Audit {0}'.format(instance.title),
            'access_token': token,
            'signers': [],
            'documents': []
        });
        envelope_id = envelope.get('envelope_id', None)
        Audit.objects.filter(id=instance.id).update(envelope_id=envelope_id)


def add_docusign_document_to_envelope(sender, instance, created, **kwargs):
    print('add_docusign_document_to_envelope hook')

    if not created and bool(instance.file):
        user = instance.audit.user
        if not instance.audit.envelope_id:
            print("No envelop found for this audit", "add_docusign_document_to_envelope")
            return
        envelope_id = str(instance.audit.envelope_id)
        token = DocuSignOAuthService.get_access_token(user)
        file_path = instance.file.path
        documents = [{
            'file_path': file_path,
            'document_id': 1,
            # TODO: add map version in name
        }]
        if bool(instance.audit.agreement):
            documents.append({
                'file_path': instance.audit.agreement.path,
                'document_id': 2
            })
        document = DocuSignService.update_document({
            'access_token': token,
            'envelope_id': envelope_id,
            'documents': documents
        })
        print('added document to envelop', document)

def export_map_as_pdf(sender, instance, created, **kwargs):
    print('export_map_as_pdf hook')
    document = instance
    if not document.file and \
        document.map_print_definition and \
        document.map_item and \
        document.map_item_data:

        download_and_save_file.delay(document.audit.id, document.id)

