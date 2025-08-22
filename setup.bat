@echo off
REM V1brate Development Setup Script for Windows

echo 🎵 Setting up V1brate Development Environment...

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

REM Check if Docker is installed
where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker is not installed. Please install Docker and try again.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Start database
echo 🐳 Starting PostgreSQL database...
cd docker
docker-compose up -d
cd ..

REM Wait for database to be ready
echo ⏳ Waiting for database to be ready...
timeout /t 10 /nobreak >nul

REM Setup backend
echo 🔧 Setting up backend...
cd backend

REM Install dependencies
echo 📦 Installing backend dependencies...
call npm install

REM Copy environment file if it doesn't exist
if not exist .env (
    echo 📝 Creating backend environment file...
    copy .env.example .env
    echo ⚠️  Please edit backend\.env with your configuration before continuing
)

REM Generate Prisma client
echo 🔄 Generating Prisma client...
call npx prisma generate

REM Run database migrations
echo 🗄️ Running database migrations...
call npx prisma migrate dev --name initial

cd ..

REM Setup frontend
echo 🖥️ Setting up frontend...
cd frontend

REM Install dependencies
echo 📦 Installing frontend dependencies...
call npm install

REM Copy environment file if it doesn't exist
if not exist .env (
    echo 📝 Creating frontend environment file...
    copy .env.example .env
)

cd ..

echo 🎉 Setup complete!
echo.
echo To start the application:
echo 1. Start the backend: cd backend ^&^& npm run start:dev
echo 2. Start the frontend: cd frontend ^&^& npm start
echo.
echo Application URLs:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:3001
echo - API Docs: http://localhost:3001/api/docs
echo - Database Admin: http://localhost:5050
echo.
echo Database credentials for pgAdmin:
echo - Email: admin@v1brate.com
echo - Password: admin123

pause
