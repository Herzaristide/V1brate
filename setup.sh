#!/bin/bash

# V1brate Development Setup Script

echo "🎵 Setting up V1brate Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker and try again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Start database
echo "🐳 Starting PostgreSQL database..."
cd docker
docker-compose up -d
cd ..

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Setup backend
echo "🔧 Setting up backend..."
cd backend

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating backend environment file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your configuration before continuing"
fi

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate dev --name initial

cd ..

# Setup frontend
echo "🖥️ Setting up frontend..."
cd frontend

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating frontend environment file..."
    cp .env.example .env
fi

cd ..

echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Start the backend: cd backend && npm run start:dev"
echo "2. Start the frontend: cd frontend && npm start"
echo ""
echo "Application URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3001"
echo "- API Docs: http://localhost:3001/api/docs"
echo "- Database Admin: http://localhost:5050"
echo ""
echo "Database credentials for pgAdmin:"
echo "- Email: admin@v1brate.com"
echo "- Password: admin123"
