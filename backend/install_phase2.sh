#!/bin/bash
# Phase 2 Installation Script for Maverick Aim Rush
# Installs Django Channels, Redis, and sets up WebSocket support

echo "🚀 Installing Phase 2 dependencies..."

# Activate virtual environment
source venv/bin/activate

# Install new packages
echo "📦 Installing Django Channels and Redis..."
pip install channels==4.0.0 channels-redis==4.1.0 redis==5.0.1

# Install Redis server (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Installing Redis on macOS..."
    if command -v brew &> /dev/null; then
        brew install redis
        brew services start redis
    else
        echo "❌ Homebrew not found. Please install Redis manually:"
        echo "   brew install redis && brew services start redis"
    fi
fi

# Run migrations
echo "🗄️ Running database migrations..."
python manage.py makemigrations
python manage.py migrate

echo "✅ Phase 2 installation complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Start Redis server: brew services start redis (macOS) or redis-server (Linux)"
echo "2. Start Django server: python manage.py runserver 127.0.0.1:8000"
echo "3. Test WebSocket connection at: ws://127.0.0.1:8000/ws/workout/test/"
echo ""
echo "📱 Real-time features now available:"
echo "- Live workout updates"
echo "- Real-time heart rate monitoring"
echo "- Live dashboard metrics"
echo "- WebSocket-based notifications"
