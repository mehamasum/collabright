from collabright.base.service import ArcGISOAuthService
from collabright.celery import app
import requests
import shutil
import os
from .models import Document
from .service import DocumentService
from django.core.files.base import File
from celery import shared_task

@shared_task
def add(x, y):
    return x + y

@app.task
def download_and_save_file(audit_id, document_id):
    document = Document.objects.get(pk=document_id)

    version = Document.objects.filter(audit=document.audit).count()
    response = ArcGISOAuthService.export_map_as_file(
        document.map_print_definition,
        document.map_item,
        document.map_item_data,
        'Map (v{0}.0)'.format(version)
    )
    url = response['results'][0]['value']['url']

    
    filename = 'v'+str(version)+'.pdf'
    local_filename = os.path.join('/tmp', str(audit_id)+"___"+filename)
    with requests.get(url, stream=True) as r:
        with open(local_filename, 'wb') as f:
            shutil.copyfileobj(r.raw, f)
    
    with open(local_filename, 'rb') as f:
        document.file.save(filename, File(f))

    print('written file', filename)
    DocumentService.add_document_to_docusign_envelope(document)
    return filename
