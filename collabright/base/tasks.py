from collabright.celery import app
import requests
import shutil
import os
from .models import Document
from django.core.files.base import File
from celery import shared_task

@shared_task
def add(x, y):
    return x + y

@app.task
def download_and_save_file(url, audit_id, version, document_id):
    document = Document.objects.get(pk=document_id)
    filename = 'v'+str(version)+'.pdf'
    local_filename = os.path.join('/tmp', str(audit_id)+"___"+filename)
    with requests.get(url, stream=True) as r:
        with open(local_filename, 'wb') as f:
            shutil.copyfileobj(r.raw, f)
    
    with open(local_filename, 'rb') as f:
        document.file.save(filename, File(f))

    print('written file', filename)
    return filename