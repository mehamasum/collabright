from celery import Celery
from collabright.celery import app

@app.task
def add(x, y):
    return x + y