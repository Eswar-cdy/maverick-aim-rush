# Maverick Aim Rush

Local setup:
1) cd "backend" && python3 -m venv venv && source venv/bin/activate
2) pip install -r requirements.txt  (if present)
3) python manage.py migrate
4) python manage.py runserver

Frontend:
cd ".." && python3 -m http.server 3000
