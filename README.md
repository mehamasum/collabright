

# Server

## Local Setup

- goto project root  
`cd YOUR_PROJECT_ROOT_DIRECTORY`

- setup python virtual environment for project  
`virtualenv -p python3.6 .venv`

- activate virtual environment  
`source .venv/bin/activate` # for linux  
`.venv/Scripts/activate`  # for windowns  

- set environment variables  
`cp .sample.env .env`  

- Make sure postgress is running and set DATABASE_URL in .env  

- Make sure mailhog is running and set EMAIL_* in .env  
`docker run -p 8025:8025 -p 1025:1025 mailhog/mailhog`  

- Make sure redis is running and set REDIS_URL in .env  
`docker run -p 6379:6379 redis`  

- install backend (api) dependencies  
`pip install -r requirements.txt`  

- migrate database with the application models  
`python manage.py migrate`

- run backend server  
`python manage.py runserver 0.0.0.0:8000`

- run celery
`celery -A collabright worker -l INFO`

---

# Client

## Local Setup

Node.js 10.13 or later needed.

- install frontend dependencies  
`npm i`

- run dev server  
`npm start`

