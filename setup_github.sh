#!/bin/bash

# Maverick Aim Rush - GitHub Setup Script
# This script helps you set up your GitHub repository

echo "🚀 Setting up Maverick Aim Rush for GitHub..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "MAR" ]; then
    print_error "Please run this script from the project root directory (THINGS FOR WEBSITE DESIGN)"
    exit 1
fi

print_step "1. Initializing Git repository..."
git init

print_step "2. Adding all files to Git..."
git add .

print_step "3. Creating initial commit..."
git commit -m "Initial commit: Maverick Aim Rush - Complete Fitness Tracking Application

- Full-stack Django REST API with JWT authentication
- Comprehensive workout tracking with 150+ exercises
- Nutrition logging and meal planning
- Progress analytics and goal management
- Weekly workout schedules
- Responsive frontend with vanilla JavaScript
- Production-ready deployment configuration"

print_status "✅ Local Git repository initialized!"

echo
print_step "4. Setting up GitHub repository..."
echo
echo "Now you need to:"
echo "1. Go to https://github.com/new"
echo "2. Create a new repository named 'maverick-aim-rush'"
echo "3. DO NOT initialize with README, .gitignore, or license (we already have them)"
echo "4. Copy the repository URL"
echo

read -p "Enter your GitHub username: " github_username
read -p "Enter the repository URL (e.g., https://github.com/username/maverick-aim-rush.git): " repo_url

if [ -z "$repo_url" ]; then
    print_warning "No repository URL provided. You can add it later with:"
    echo "git remote add origin https://github.com/$github_username/maverick-aim-rush.git"
else
    print_step "5. Adding remote origin..."
    git remote add origin "$repo_url"
    
    print_step "6. Pushing to GitHub..."
    git branch -M main
    git push -u origin main
    
    print_status "✅ Repository pushed to GitHub!"
fi

echo
print_status "🎉 GitHub setup complete!"
echo
echo "📋 Next steps:"
echo "1. Update the README.md file with your actual GitHub username"
echo "2. Add screenshots or demo images to showcase your application"
echo "3. Set up GitHub Pages for live demo (optional)"
echo "4. Add topics/tags to your repository"
echo "5. Create a detailed project description"
echo
echo "🔗 Your repository will be available at:"
echo "https://github.com/$github_username/maverick-aim-rush"
echo
echo "📚 Useful GitHub features to enable:"
echo "- Issues: For bug reports and feature requests"
echo "- Projects: For project management"
echo "- Wiki: For detailed documentation"
echo "- Actions: For CI/CD automation"
echo
print_status "Good luck showcasing your amazing fitness tracking application! 🏃‍♂️"
