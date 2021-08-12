#!/bin/sh
set -e

echo "Starting..."

npm install && rm -rf /usr/local/share/.cache
npm run build

pip install --no-cache-dir -r /app/requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

/etc/init.d/nginx start

mkdir -p /var/log/uwsgi
chown -R www-data:www-data /var/log/uwsgi
uwsgi --ini /app/scripts/uwsgi.ini

# TODO: separate out from web servers
mkdir -p /var/log/celery
chown -R nobody:nogroup /var/log/celery
celery --app=collabright worker \
        --loglevel=INFO --logfile=/var/log/celery/collabright.log \
        --uid=nobody --gid=nogroup
