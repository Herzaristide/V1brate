# V1brate - Music Training & Tools Application

A comprehensive Progressive Web App (PWA) for music training with real-time pitch analysis, recording capabilities, and a customizable dashboard.

## 🎵 Features

### Core Features

- **Real-time Pitch Analysis**: Advanced pitch detection with accuracy measurement in cents
- **Smart Recording**: Record practice sessions with synchronized pitch analysis data
- **Customizable Dashboard**: Drag, drop, and resize widgets to create your perfect practice environment
- **Progressive Web App**: Install on any device with offline capabilities
- **Multi-Key Support**: Practice in any musical key (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
- **Notation Systems**: Switch between ABC notation and Do-Ré-Mi solfège
- **Cloud Sync**: Your data is automatically synced across all devices

### Authentication

- Email/password registration and login
- Discord OAuth integration
- Google OAuth integration
- JWT-based secure authentication

### Widgets

1. **Pitch Analyzer Widget**

   - Real-time pitch detection using microphone input
   - Visual note display on musical staff
   - Configurable buffer size (50-500 notes)
   - Accuracy feedback with cents deviation
   - Recent notes timeline visualization

2. **Recording Widget**
   - High-quality audio recording with configurable quality settings
   - Local file saving and cloud upload
   - Recording management (play, download, delete)
   - Auto-save functionality

## 🛠️ Tech Stack

### Backend (Node.js/NestJS)

- **NestJS**: Progressive Node.js framework with TypeScript
- **PostgreSQL**: Robust database with UUID support
- **Prisma**: Modern ORM with type safety
- **JWT Authentication**: Secure token-based auth
- **OAuth2**: Discord and Google integration
- **Async/Await**: High-performance async operations

### Frontend

- **React 18**: Modern React with hooks
- **TailwindCSS**: Utility-first CSS framework
- **React Grid Layout**: Drag-and-drop dashboard widgets
- **Progressive Web App**: Service worker with offline caching
- **Web Audio API**: Real-time audio processing
- **MediaRecorder API**: Audio recording capabilities

### Database

- **PostgreSQL 15**: Containerized database
- **UUID Primary Keys**: Scalable and secure
- **JSONB Storage**: Flexible configuration data
- **Async Queries**: High-performance database operations

## Project Structure

```
V1brate/
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── api/            # API route handlers
│   │   ├── core/           # Core functionality (config, database, security)
│   │   ├── models/         # Database models and schemas
│   │   └── services/       # Business logic services
│   ├── uploads/            # User uploaded files
│   ├── requirements.txt    # Python dependencies
│   └── main.py            # Application entry point
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── widgets/        # Dashboard widgets
│   │   ├── services/       # API service layer
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets and PWA files
│   └── package.json        # Node.js dependencies
└── docker/                 # Database containerization
    ├── docker-compose.yml  # PostgreSQL container setup
    └── init.sql           # Database initialization
```

## Getting Started

### Prerequisites

- Python 3.8+ (for backend)
- Node.js 16+ (for frontend)
- Docker & Docker Compose (for database)

### Database Setup

1. Start PostgreSQL container:
   ```powershell
   cd docker
   docker-compose up -d
   ```

### Backend Setup

1. Navigate to backend directory:

   ```powershell
   cd backend
   ```

2. Create virtual environment:

   ```powershell
   python -m venv venv
   venv\Scripts\activate
   ```

3. Install dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

4. Configure environment variables in `.env`:

   ```
   DATABASE_URL=postgresql://v1brate_user:v1brate_password@localhost:5432/v1brate
   SECRET_KEY=your-super-secret-key-change-this-in-production
   DISCORD_CLIENT_ID=your-discord-client-id
   DISCORD_CLIENT_SECRET=your-discord-client-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

5. Start the backend server:
   ```powershell
   python main.py
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:

   ```powershell
   cd frontend
   ```

2. Install dependencies:

   ```powershell
   npm install
   ```

3. Configure environment variables in `.env`:

   ```
   REACT_APP_API_URL=http://localhost:8000
   REACT_APP_DISCORD_CLIENT_ID=your-discord-client-id
   REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
   ```

4. Start the development server:
   ```powershell
   npm start
   ```

The frontend will be available at `http://localhost:3000`

### OAuth Setup (Optional)

#### Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "OAuth2" section
4. Add redirect URI: `http://localhost:3000/auth/discord/callback`
5. Copy Client ID and Client Secret to your environment files

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" section
5. Create OAuth 2.0 Client ID
6. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
7. Copy Client ID and Client Secret to your environment files

## Development

### Backend Development

- The backend uses FastAPI with automatic OpenAPI documentation
- Visit `http://localhost:8000/docs` for interactive API documentation
- Database migrations are handled automatically by SQLAlchemy
- All endpoints require authentication except for registration and login

### Frontend Development

- The frontend is a React 18 application with TypeScript support
- TailwindCSS is configured for styling
- Hot reload is enabled for development
- Service worker is registered for PWA functionality

### Pitch Detection Algorithm

The application uses a custom autocorrelation-based pitch detection algorithm:

- Samples audio at 44.1kHz
- Uses FFT analysis for frequency detection
- Implements parabolic interpolation for sub-sample accuracy
- Provides cent-level pitch accuracy measurement

## Deployment

### Production Configuration

1. Update environment variables for production
2. Set up SSL certificates for HTTPS
3. Configure reverse proxy (nginx recommended)
4. Set up production database with connection pooling
5. Enable PWA features for offline functionality

### Security Considerations

- Use strong secret keys in production
- Enable HTTPS for all communications
- Validate all user inputs
- Implement rate limiting
- Regular security updates

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/oauth/{provider}` - OAuth login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update user settings

### Recordings

- `POST /api/recordings/upload` - Upload recording
- `GET /api/recordings/` - Get user recordings
- `GET /api/recordings/{id}` - Get specific recording
- `DELETE /api/recordings/{id}` - Delete recording

### Dashboard

- `GET /api/dashboard/widgets` - Get user widgets
- `POST /api/dashboard/widgets` - Create widget
- `PUT /api/dashboard/widgets/{id}` - Update widget
- `DELETE /api/dashboard/widgets/{id}` - Delete widget
- `POST /api/dashboard/widgets/bulk-update` - Bulk update widgets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the development team.
