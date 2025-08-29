# 🏃‍♂️ Maverick Aim Rush - Fitness Tracking Application

A comprehensive full-stack fitness tracking web application built with Django REST API and vanilla JavaScript.

![Maverick Aim Rush](https://img.shields.io/badge/Maverick-Aim%20Rush-blue?style=for-the-badge&logo=django)
![Python](https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python)
![Django](https://img.shields.io/badge/Django-5.2.5-green?style=for-the-badge&logo=django)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow?style=for-the-badge&logo=javascript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?style=for-the-badge&logo=postgresql)

## 🎯 Project Overview

**Maverick Aim Rush** is a complete fitness tracking solution that helps users achieve their fitness goals through personalized workout plans, comprehensive nutrition tracking, and detailed progress monitoring.

### ✨ Key Features

- 🏋️ **Workout Tracking**: 150+ exercises with filtering and logging
- 🍎 **Nutrition Logging**: Meal planning and macro tracking
- 📊 **Progress Analytics**: Body measurements and performance trends
- 🎯 **Goal Management**: SMART goal setting and progress tracking
- 📅 **Weekly Schedules**: 7-day personalized workout plans
- 🔐 **User Authentication**: Secure JWT-based user management
- 📱 **Responsive Design**: Works perfectly on all devices

## 🏗️ Architecture

### Frontend
- **HTML5** - Semantic markup and structure
- **CSS3** - Responsive design and modern styling
- **Vanilla JavaScript** - Dynamic functionality and API integration
- **Local Storage** - Client-side data persistence

### Backend
- **Django 5.2.5** - Web framework
- **Django REST Framework** - API development
- **JWT Authentication** - Secure token-based authentication
- **PostgreSQL** - Production database (SQLite for development)
- **Django Filter** - Advanced filtering capabilities

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Git
- Web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/maverick-aim-rush.git
   cd maverick-aim-rush
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```

3. **Set up the frontend**
   ```bash
   cd ../MAR
   python -m http.server 8001
   ```

4. **Access the application**
   - Frontend: http://localhost:8001
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

## 📊 Features Demo

### 🏋️ Workout Tracking
- Browse 150+ exercises with detailed information
- Filter by muscle group, equipment, difficulty, and goals
- Log sets, reps, and weights with real-time tracking
- Track personal records and progress over time

### 🍎 Nutrition Logging
- Comprehensive food database with nutritional information
- Meal planning and calorie tracking
- Macro monitoring (protein, carbs, fats)
- Daily nutrition progress visualization

### 📈 Progress Analytics
- Body measurements tracking (weight, body fat, BMI)
- Performance trends and visualizations
- Goal progress monitoring with ETA calculations
- Export data for external analysis

### 🎯 Goal Management
- Set SMART fitness goals
- Track progress with visual indicators
- Receive completion estimates
- Monitor multiple goal types (weight, strength, body composition)

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register/     # User registration
POST /api/auth/login/        # User login
POST /api/auth/refresh/      # Token refresh
```

### Workouts
```
GET  /api/exercises/         # Exercise catalog
GET  /api/sessions/          # Workout sessions
POST /api/sessions/          # Create workout session
POST /api/strength-sets/     # Log strength sets
POST /api/cardio-entries/    # Log cardio workouts
```

### Nutrition
```
GET  /api/foods/             # Food catalog
GET  /api/nutrition-logs/    # Nutrition logs
POST /api/nutrition-logs/    # Create nutrition log
```

### Progress
```
GET  /api/measurements/      # Body measurements
POST /api/measurements/      # Log measurements
GET  /api/goals/             # User goals
POST /api/goals/             # Create goals
GET  /api/progress/summary/  # Progress analytics
```

## 🗄️ Database Schema

The application uses a comprehensive database schema with 10+ models:

- **User** - Authentication and user profiles
- **ExerciseCatalog** - 150+ exercises with detailed information
- **WorkoutSession** - Workout tracking sessions
- **StrengthSet** - Individual exercise sets
- **CardioEntry** - Cardio workout entries
- **NutritionLog** - Food and nutrition tracking
- **BodyMeasurement** - Body composition tracking
- **Goal** - User fitness goals
- **Muscle** - Muscle groups for categorization
- **Equipment** - Exercise equipment types

## 🎨 User Interface

### Pages
1. **Dashboard** - Main overview with recent activity and quick stats
2. **Workout Tracker** - Exercise catalog and workout logging
3. **Nutrition Log** - Meal planning and nutrition tracking
4. **Progress Analytics** - Progress visualization and measurements

### Design Features
- Responsive design that works on all devices
- Modern, clean interface with intuitive navigation
- Real-time updates and smooth animations
- Accessible design with proper contrast and readability

## 🔧 Development

### Project Structure
```
maverick-aim-rush/
├── backend/                 # Django backend
│   ├── backend/            # Django project settings
│   ├── tracker/            # Main app with models and views
│   ├── requirements.txt    # Python dependencies
│   ├── production_settings.py  # Production configuration
│   └── deploy.sh          # Deployment script
├── MAR/                    # Frontend static files
│   ├── index.html         # Dashboard page
│   ├── about.html         # Workout tracker
│   ├── services.html      # Nutrition log
│   ├── contact.html       # Progress analytics
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   └── images/            # Static images
├── DEPLOYMENT_GUIDE.md    # Deployment instructions
├── PROJECT_SUMMARY.md     # Project documentation
└── README.md              # This file
```

### Running Tests
```bash
cd backend
python manage.py test
```

### Code Style
- Python: PEP 8
- JavaScript: ES6+ standards
- HTML: Semantic markup
- CSS: BEM methodology

## 🚀 Deployment

The application is ready for production deployment on multiple platforms:

### Backend Deployment Options
- **Heroku** - Easy deployment with PostgreSQL
- **Railway** - Modern platform with good free tier
- **Render** - Simple deployment with automatic scaling
- **DigitalOcean** - Full control with App Platform

### Frontend Deployment Options
- **Vercel** - Optimized for static sites
- **Netlify** - Easy deployment with forms
- **GitHub Pages** - Free hosting for static sites

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🔐 Security Features

- JWT token-based authentication
- CORS configuration for cross-origin requests
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Secure session management

## 📈 Performance

- Database query optimization
- API pagination for large datasets
- Frontend caching with localStorage
- Efficient filtering and search
- Responsive design for all devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- Portfolio: [Your Portfolio](https://yourportfolio.com)

## 🙏 Acknowledgments

- Django community for the excellent framework
- Fitness enthusiasts for inspiration and feedback
- Open source contributors for various libraries used

## 📞 Support

If you have any questions or need help:

1. Check the [documentation](PROJECT_SUMMARY.md)
2. Review the [deployment guide](DEPLOYMENT_GUIDE.md)
3. Open an issue on GitHub
4. Contact the author

---

**Made with ❤️ for fitness enthusiasts everywhere**

![GitHub stars](https://img.shields.io/github/stars/yourusername/maverick-aim-rush?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/maverick-aim-rush?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/maverick-aim-rush)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/maverick-aim-rush)
