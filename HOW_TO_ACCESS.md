# 🚀 How to Access Maverick Aim Rush from GitHub

This guide shows you all the ways to access and run your Maverick Aim Rush project from GitHub.

## 📍 **Your Repository URL**
**https://github.com/Eswar-cdy/maverick-aim-rush**

## 🎯 **Quick Start (Easiest Method)**

### **Option 1: Automated Setup Script**
```bash
# Download and run the setup script
curl -O https://raw.githubusercontent.com/Eswar-cdy/maverick-aim-rush/main/quick_setup.sh
chmod +x quick_setup.sh
./quick_setup.sh
```

### **Option 2: Manual Setup**
```bash
# Clone the repository
git clone https://github.com/Eswar-cdy/maverick-aim-rush.git
cd maverick-aim-rush

# Run the setup script
./quick_setup.sh
```

## 💻 **Detailed Access Methods**

### **Method 1: Clone to Any Computer**

#### **Prerequisites**
- Git installed
- Python 3.12+ installed
- Internet connection

#### **Steps**
```bash
# 1. Clone the repository
git clone https://github.com/Eswar-cdy/maverick-aim-rush.git

# 2. Navigate to project
cd maverick-aim-rush

# 3. Set up backend
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate

# 4. Start backend server
python manage.py runserver

# 5. In a new terminal, start frontend
cd MAR
python -m http.server 8001
```

#### **Access URLs**
- **Frontend**: http://localhost:8001
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

### **Method 2: Download ZIP File**

#### **Steps**
1. Go to: https://github.com/Eswar-cdy/maverick-aim-rush
2. Click the green **"Code"** button
3. Select **"Download ZIP"**
4. Extract the ZIP file
5. Follow the setup steps above

### **Method 3: Access from Different Computer**

#### **New Computer Setup**
```bash
# Install prerequisites (if not already installed)
# Git: https://git-scm.com/downloads
# Python: https://www.python.org/downloads/

# Clone and setup
git clone https://github.com/Eswar-cdy/maverick-aim-rush.git
cd maverick-aim-rush
./quick_setup.sh
```

### **Method 4: Access from Mobile/Tablet**

#### **GitHub Mobile App**
1. Download GitHub mobile app
2. Search for "Eswar-cdy/maverick-aim-rush"
3. Browse code and documentation

#### **Web Browser**
1. Visit: https://github.com/Eswar-cdy/maverick-aim-rush
2. Browse files, documentation, and code

## 🔄 **Keeping Your Local Copy Updated**

### **Pull Latest Changes**
```bash
# Navigate to your project
cd maverick-aim-rush

# Pull latest changes from GitHub
git pull origin main
```

### **Push Your Changes**
```bash
# Add your changes
git add .

# Commit changes
git commit -m "Description of your changes"

# Push to GitHub
git push origin main
```

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. Git Not Found**
```bash
# Install Git
# macOS: brew install git
# Windows: Download from https://git-scm.com/
# Linux: sudo apt-get install git
```

#### **2. Python Not Found**
```bash
# Install Python 3.12+
# macOS: brew install python@3.12
# Windows: Download from https://www.python.org/
# Linux: sudo apt-get install python3.12
```

#### **3. Permission Denied**
```bash
# Make setup script executable
chmod +x quick_setup.sh
```

#### **4. Port Already in Use**
```bash
# Use different ports
python manage.py runserver 8002  # Backend on port 8002
python -m http.server 8003       # Frontend on port 8003
```

#### **5. Virtual Environment Issues**
```bash
# Remove and recreate virtual environment
rm -rf .venv
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 📱 **Mobile Access Options**

### **GitHub Mobile App**
- View code and documentation
- Read issues and discussions
- Browse project structure

### **Web Browser (Mobile)**
- Full repository access
- View README and documentation
- Download ZIP file

### **Code Editors with Git Support**
- **VS Code**: Clone directly from GitHub
- **PyCharm**: Import from version control
- **Sublime Text**: Git integration

## 🌐 **Online Code Viewing**

### **GitHub Web Interface**
- Browse all files online
- View code with syntax highlighting
- Read documentation
- Check commit history

### **GitHub Codespaces** (If Available)
- Run the project in the cloud
- No local setup required
- Full development environment

## 📋 **Quick Reference Commands**

### **Setup Commands**
```bash
# Clone repository
git clone https://github.com/Eswar-cdy/maverick-aim-rush.git

# Quick setup
cd maverick-aim-rush
./quick_setup.sh

# Manual setup
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
```

### **Run Commands**
```bash
# Backend (Terminal 1)
cd backend
source .venv/bin/activate
python manage.py runserver

# Frontend (Terminal 2)
cd MAR
python -m http.server 8001
```

### **Update Commands**
```bash
# Pull latest changes
git pull origin main

# Push your changes
git add .
git commit -m "Your message"
git push origin main
```

## 🎯 **Access Scenarios**

### **Scenario 1: New Computer**
```bash
git clone https://github.com/Eswar-cdy/maverick-aim-rush.git
cd maverick-aim-rush
./quick_setup.sh
```

### **Scenario 2: Share with Friends**
Send them the repository URL: https://github.com/Eswar-cdy/maverick-aim-rush

### **Scenario 3: Job Interview**
Share your repository and live demo (if deployed)

### **Scenario 4: Portfolio**
Include the GitHub link in your resume/portfolio

## ✅ **Verification Checklist**

After accessing your project, verify:

- [ ] Repository clones successfully
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Application loads in browser
- [ ] Login/registration works
- [ ] All features function properly

## 🎉 **Success!**

Your Maverick Aim Rush project is now accessible from anywhere in the world through GitHub!

**Repository**: https://github.com/Eswar-cdy/maverick-aim-rush

---

**Need help?** Check the troubleshooting section or create an issue on GitHub!
