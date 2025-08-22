# V1brate Backend

A comprehensive Express.js backend API for the V1brate music analysis application, providing authentication, file management, pitch analysis, and subscription management.

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with role-based access control
- 📁 **File Management**: Audio file upload, streaming, and metadata management
- 🎵 **Pitch Analysis**: Real-time and batch pitch analysis with musical notation
- 🎛️ **Widget System**: Configurable dashboard widgets with presets
- 💳 **Subscription Management**: Tiered subscriptions with usage tracking
- 💰 **Payment Processing**: Payment intent creation and processing (Stripe integration ready)
- 📊 **Analytics**: User activity tracking and audit logging
- 🛡️ **Security**: Rate limiting, CORS, helmet, input validation

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and navigate to backend directory**

```bash
cd backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
copy .env.example .env
```

Edit `.env` with your database URL and other configuration.

4. **Set up the database**

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. **Start development server**

```bash
npm run dev
```

The server will start on http://localhost:3001

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Users

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `GET /api/users/me/stats` - Get user statistics
- `GET /api/users/me/activities` - Get user activities
- `DELETE /api/users/me` - Delete user account

### Recordings

- `GET /api/recordings` - List user recordings
- `POST /api/recordings` - Upload new recording
- `GET /api/recordings/:id` - Get recording details
- `PUT /api/recordings/:id` - Update recording metadata
- `DELETE /api/recordings/:id` - Delete recording
- `GET /api/recordings/:id/stream` - Stream recording audio

### Pitch Analysis

- `GET /api/pitch-analysis` - List pitch analyses
- `POST /api/pitch-analysis` - Create new analysis
- `GET /api/pitch-analysis/:id` - Get analysis details
- `PUT /api/pitch-analysis/:id` - Update analysis
- `DELETE /api/pitch-analysis/:id` - Delete analysis
- `POST /api/pitch-analysis/:id/notes` - Add note to analysis
- `GET /api/pitch-analysis/:id/stats` - Get analysis statistics

### Widgets

- `GET /api/widgets/configs` - Get widget configurations
- `POST /api/widgets/configs` - Create widget configuration
- `PUT /api/widgets/configs/:id` - Update widget configuration
- `DELETE /api/widgets/configs/:id` - Delete widget configuration
- `GET /api/widgets/presets` - Get widget presets
- `POST /api/widgets/presets` - Create widget preset
- `POST /api/widgets/presets/:id/apply` - Apply widget preset

### Subscriptions

- `GET /api/subscriptions/me` - Get user subscription
- `PUT /api/subscriptions/me` - Update subscription
- `GET /api/subscriptions/me/usage` - Get usage statistics
- `POST /api/subscriptions/me/cancel` - Cancel subscription
- `GET /api/subscriptions/plans` - Get available plans

### Payments

- `GET /api/payments` - Get payment history
- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments/:id/confirm` - Confirm payment
- `GET /api/payments/stats/summary` - Get payment statistics

## Database Schema

The backend uses Prisma ORM with PostgreSQL. Key models include:

- **User**: User accounts with preferences and roles
- **Recording**: Audio file metadata and storage
- **PitchAnalysis**: Pitch analysis data and settings
- **WidgetConfig**: Dashboard widget configurations
- **Subscription**: User subscription tiers and limits
- **Payment**: Payment tracking and history
- **Session**: User session management
- **UserActivity**: Activity tracking for analytics
- **AuditLog**: Security and compliance logging

## File Structure

```
src/
├── server.ts              # Main server file
├── lib/
│   └── prisma.ts          # Database connection
├── middleware/
│   ├── auth.ts            # Authentication middleware
│   ├── errorHandler.ts    # Error handling
│   └── notFound.ts        # 404 handler
└── routes/
    ├── auth.ts            # Authentication routes
    ├── users.ts           # User management
    ├── recordings.ts      # Recording management
    ├── pitchAnalysis.ts   # Pitch analysis
    ├── widgets.ts         # Widget system
    ├── subscriptions.ts   # Subscription management
    └── payments.ts        # Payment processing
```

## Environment Variables

| Variable             | Description                          | Default               |
| -------------------- | ------------------------------------ | --------------------- |
| `NODE_ENV`           | Environment (development/production) | development           |
| `PORT`               | Server port                          | 3001                  |
| `DATABASE_URL`       | PostgreSQL connection string         | Required              |
| `JWT_SECRET`         | JWT signing secret                   | Required              |
| `JWT_REFRESH_SECRET` | JWT refresh token secret             | Required              |
| `CORS_ORIGINS`       | Allowed CORS origins                 | http://localhost:3000 |
| `MAX_FILE_SIZE`      | Maximum upload file size             | 50MB                  |
| `STRIPE_SECRET_KEY`  | Stripe secret key                    | Optional              |

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configurable origin whitelist
- **Helmet**: Security headers
- **Input Validation**: Express-validator for all endpoints
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin and user roles
- **File Upload Security**: Type validation and size limits
- **SQL Injection Protection**: Prisma ORM parameterized queries

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

### Testing

Test endpoints using the health check:

```bash
curl http://localhost:3001/health
```

### Adding New Routes

1. Create route file in `src/routes/`
2. Add authentication middleware if needed
3. Import and use in `src/server.ts`
4. Update this README

## Production Deployment

1. **Build the application**

```bash
npm run build
```

2. **Set production environment variables**
3. **Run database migrations**

```bash
npm run db:migrate
```

4. **Start the server**

```bash
npm start
```

## Monitoring

- Health check endpoint: `GET /health`
- Error logging in development mode
- Activity tracking for user analytics
- Audit logging for security compliance

## Contributing

1. Follow TypeScript best practices
2. Use Prisma for all database operations
3. Validate all inputs with express-validator
4. Add proper error handling
5. Update API documentation

## License

[Your License Here]
