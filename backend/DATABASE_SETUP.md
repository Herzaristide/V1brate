# V1brate Backend Database Setup Guide

This guide will help you set up the PostgreSQL database for the V1brate backend.

## 🗄️ Database Setup Options

### Option 1: Local PostgreSQL Installation

#### Step 1: Install PostgreSQL

**Windows:**

1. Download from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the `postgres` user

**Or use Chocolatey:**

```powershell
choco install postgresql
```

#### Step 2: Create Database

```sql
-- Connect to PostgreSQL (using psql or pgAdmin)
CREATE DATABASE v1brate;
CREATE USER v1brate_user WITH PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE v1brate TO v1brate_user;
```

#### Step 3: Update .env file

```bash
DATABASE_URL="postgresql://v1brate_user:secure_password_123@localhost:5432/v1brate?schema=public"
```

### Option 2: Docker PostgreSQL (Recommended)

#### Step 1: Create docker-compose.yml

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: v1brate
      POSTGRES_USER: v1brate_user
      POSTGRES_PASSWORD: secure_password_123
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### Step 2: Start Database

```bash
cd backend
docker-compose up -d
```

#### Step 3: Update .env file

```bash
DATABASE_URL="postgresql://v1brate_user:secure_password_123@localhost:5432/v1brate?schema=public"
```

### Option 3: Cloud Database (Production)

Popular cloud options:

- **Supabase** (Free tier available): https://supabase.com/
- **Railway** (Free tier): https://railway.app/
- **Neon** (Free tier): https://neon.tech/
- **AWS RDS**, **Google Cloud SQL**, etc.

## 🚀 Backend Setup Steps

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
# Copy the .env file (already created)
# Update DATABASE_URL with your database credentials
```

### 3. Generate Prisma Client

```bash
npm run db:generate
```

### 4. Run Database Migrations

```bash
npm run db:migrate
```

### 5. Seed Database (Optional)

```bash
npm run db:seed
```

### 6. Start Development Server

```bash
npm run dev
```

## 🔧 Available Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Apply migrations
npm run db:migrate

# Reset database (WARNING: Deletes all data)
npm run db:reset

# Seed database with sample data
npm run db:seed

# Open Prisma Studio (Database GUI)
npm run db:studio

# Deploy migrations to production
npm run db:deploy

# Create new migration
npm run db:migrate:dev
```

## ⚠️ Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"

- Ensure `.env` file exists in backend directory
- Check that DATABASE_URL is properly set
- Restart your development server

### Error: "Connection refused"

- Ensure PostgreSQL is running
- Check the connection details in DATABASE_URL
- Verify firewall settings

### Error: "Database does not exist"

- Create the database using SQL commands above
- Or use `createdb v1brate` command

### Error: "Authentication failed"

- Check username and password in DATABASE_URL
- Ensure the user has proper permissions

## 🔒 Security Notes

1. **Change default passwords** in production
2. **Use environment variables** for sensitive data
3. **Enable SSL** for production databases
4. **Regular backups** are recommended

## 📊 Database Schema Overview

The V1brate database includes:

- **Users** - User accounts and preferences
- **Recordings** - Audio file metadata
- **PitchAnalyses** - Musical analysis data
- **WidgetConfigs** - Dashboard configurations
- **Subscriptions** - User subscription tiers
- **Payments** - Payment transactions
- **Notes & Bookmarks** - User annotations

## 🌐 Production Deployment

For production, consider:

1. Using managed PostgreSQL service
2. Setting up connection pooling
3. Enabling SSL connections
4. Regular automated backups
5. Monitoring and logging

## 📞 Need Help?

If you encounter issues:

1. Check the error logs in the terminal
2. Verify all environment variables are set
3. Ensure database is accessible
4. Try regenerating Prisma client
