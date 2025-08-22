@echo off
echo Setting up V1brate Backend...
echo.

echo Step 1: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing dependencies!
    pause
    exit /b 1
)

echo.
echo Step 2: Checking if PostgreSQL is running...
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo PostgreSQL not detected. Starting Docker database...
    docker-compose up -d postgres
    if %errorlevel% neq 0 (
        echo Error: Could not start PostgreSQL with Docker.
        echo Please install PostgreSQL manually or ensure Docker is running.
        echo See DATABASE_SETUP.md for detailed instructions.
        pause
        exit /b 1
    )
    echo Waiting for database to be ready...
    timeout /t 10 /nobreak >nul
)

echo.
echo Step 3: Generating Prisma client...
call npm run db:generate
if %errorlevel% neq 0 (
    echo Error generating Prisma client!
    pause
    exit /b 1
)

echo.
echo Step 4: Running database migrations...
call npm run db:migrate
if %errorlevel% neq 0 (
    echo Error running migrations!
    pause
    exit /b 1
)

echo.
echo Step 5: Seeding database with sample data...
call npm run db:seed
if %errorlevel% neq 0 (
    echo Warning: Database seeding failed, but continuing...
)

echo.
echo ✅ Backend setup complete!
echo.
echo You can now start the development server with:
echo   npm run dev
echo.
echo Or open the database GUI with:
echo   npm run db:studio
echo.
pause
