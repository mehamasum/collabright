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
            'documents': [{
                'html_definition': {
                    'source': "<html><body><div>Example HTML page source</div></body></html>"
                },
                'document_id': 2,
                'name': 'Audit Details'
            }]
        });
        envelope_id = envelope.get('envelope_id', None)
        Audit.objects.filter(id=instance.id).update(envelope_id=envelope_id)

def export_map_as_pdf(sender, instance, created, **kwargs):
    print('export_map_as_pdf hook')
    document = instance
    if not document.file and \
        document.map_print_definition and \
        document.map_item and \
        document.map_item_data:

        download_and_save_file.delay(document.audit.id, document.id)

