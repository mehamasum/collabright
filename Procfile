web: bin/start-pgbouncer uwsgi scripts/uwsgi.ini
worker: bin/start-pgbouncer celery -A collabright worker -l INFO
release: python manage.py migrate