from django.db.models.signals import post_save
from .service import DocuSignOAuthService, DocuSignService, ArcGISOAuthService
from .models import Audit, Document
from .tasks import download_and_save_file
from .utils import compute_hash
from django.conf import settings
from django.template.loader import render_to_string


# on audit
def create_docusign_envelope(sender, instance, created, **kwargs):
    if created:
        user = instance.user
        org_name = user.organization.name or 'Collabright Platform'
        token = DocuSignOAuthService.get_access_token(user)
        hash = compute_hash(settings.DOCUSIGN_SECRET_KEY.encode('utf-8'), str(instance.id).encode('utf-8'))
        audit_metadata_as_document = render_to_string('audit_metadata.html', {
            'audit_id': str(instance.id),
            'audit_created_at': str(instance.created_at),
            'audit_title': instance.title,
            'audit_description': instance.description or 'N/A',
            'audit_user': str(instance.user.id),
            'audit_user_username': instance.user.username,
            'audit_org': str(instance.user.organization.id) if instance.user.organization else "Personal Account",
            'audit_orgname': instance.user.organization.name if instance.user.organization else "N/A",
            'audit_map_url': instance.map_url,
        })

        envelope = DocuSignService.create_envelope({
            'email_subject': 'Please sign the agreement from {0}'.format(org_name),
            'access_token': token,
            'signers': [],
            'documents': [{
                'html_definition': {
                    'source': audit_metadata_as_document
                },
                'document_id': 2,
                'name': 'Audit Metadata from Collabright'
            }],
            'audit_id': instance.id,
            'audit_token': hash
        })
        envelope_id = envelope.get('envelope_id', None)
        Audit.objects.filter(id=instance.id).update(envelope_id=envelope_id)

def export_map_as_pdf(sender, instance, created, **kwargs):
    document = instance
    if not document.file and \
        document.map_print_definition and \
        document.map_item and \
        document.map_item_data:

        download_and_save_file.delay(document.audit.id, document.id)

