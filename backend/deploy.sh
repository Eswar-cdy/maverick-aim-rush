#!/bin/bash

# Maverick Aim Rush - Deployment Script
# This script automates the deployment process

echo "🚀 Starting Maverick Aim Rush Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    print_error "Please run this script from the backend directory"
    exit 1
fi

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    print_warning "Virtual environment not detected. Please activate it first."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_status "Installing production dependencies..."
pip install -r requirements.txt

print_status "Running security checks..."
python manage.py check --deploy

print_status "Collecting static files..."
python manage.py collectstatic --noinput

print_status "Running database migrations..."
python manage.py migrate

print_status "Creating backup of current data..."
python manage.py dumpdata > backup_$(date +%Y%m%d_%H%M%S).json

print_status "Checking for superuser..."
python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(is_superuser=True).exists():
    print('No superuser found. Please create one manually:')
    print('python manage.py createsuperuser')
else:
    print('Superuser exists')
"

print_status "Testing production settings..."
DJANGO_SETTINGS_MODULE=production_settings python manage.py check

print_status "✅ Deployment preparation complete!"

echo
echo "📋 Next Steps:"
echo "1. Choose your deployment platform (Heroku, Railway, Render, etc.)"
echo "2. Follow the instructions in DEPLOYMENT_GUIDE.md"
echo "3. Set up your production database"
echo "4. Configure environment variables"
echo "5. Deploy your application"
echo
echo "🔐 Security Reminders:"
echo "- Update SECRET_KEY in production"
echo "- Set DEBUG=False"
echo "- Configure ALLOWED_HOSTS"
echo "- Enable HTTPS"
echo "- Set up proper CORS settings"
echo
echo "📚 Documentation: DEPLOYMENT_GUIDE.md"
echo "🎉 Good luck with your deployment!"
