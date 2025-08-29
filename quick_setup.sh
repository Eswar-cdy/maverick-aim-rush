#!/bin/bash

# Maverick Aim Rush - Quick Setup Script
# This script clones and sets up the project from GitHub

echo "🚀 Setting up Maverick Aim Rush from GitHub..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.12+ first."
    exit 1
fi

# Repository URL
REPO_URL="https://github.com/Eswar-cdy/maverick-aim-rush.git"
PROJECT_NAME="maverick-aim-rush"

print_status "Cloning repository from GitHub..."
git clone $REPO_URL

if [ $? -ne 0 ]; then
    print_error "Failed to clone repository. Please check your internet connection."
    exit 1
fi

print_status "Repository cloned successfully!"

cd $PROJECT_NAME

print_status "Setting up backend..."
cd backend

# Create virtual environment
print_status "Creating virtual environment..."
python3 -m venv .venv

# Activate virtual environment
print_status "Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt

# Run migrations
print_status "Setting up database..."
python manage.py migrate

print_status "Backend setup complete!"

# Instructions for running
echo
print_status "✅ Setup complete! To run the application:"
echo
echo "1. Start the backend server:"
echo "   cd backend"
echo "   source .venv/bin/activate"
echo "   python manage.py runserver"
echo
echo "2. Start the frontend server (in a new terminal):"
echo "   cd MAR"
echo "   python -m http.server 8001"
echo
echo "3. Access the application:"
echo "   Frontend: http://localhost:8001"
echo "   Backend API: http://localhost:8000"
echo "   Admin Panel: http://localhost:8000/admin"
echo
print_status "🎉 Your Maverick Aim Rush application is ready to run!"
