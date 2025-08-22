# V1brate Frontend

React-based frontend application for V1brate music analysis platform with comprehensive dashboard, widget system, and subscription management.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. **Navigate to frontend directory**

```bash
cd frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment**

```bash
copy .env.example .env
# Edit .env with your backend API URL
```

4. **Start development server**

```bash
npm start
```

The app will be available at http://localhost:3000

## 🔧 Environment Configuration

Key environment variables:

```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=development
REACT_APP_ENABLE_DEVTOOLS=true
REACT_APP_MAX_FILE_SIZE=50MB
```

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Generic UI components
│   ├── widgets/         # Dashboard widgets
│   └── tuner/           # Music-specific components
├── contexts/            # React contexts for state management
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   ├── UserPreferencesContext.tsx
│   └── WidgetContext.tsx
├── hooks/               # Custom React hooks
│   ├── useUser.ts
│   ├── useRecordings.ts
│   └── useSubscription.ts
├── pages/               # Page components
├── services/            # API service layers
│   ├── api.ts
│   ├── authService.ts
│   ├── userService.ts
│   ├── recordingService.ts
│   ├── pitchAnalysisService.ts
│   ├── widgetService.ts
│   ├── subscriptionService.ts
│   └── paymentService.ts
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── App.tsx             # Main application component
```

## 🔑 Key Features

### Authentication & User Management

- JWT-based authentication with automatic token refresh
- User profile management with preferences
- Activity tracking and statistics

### Dashboard & Widgets

- Drag-and-drop widget system with React Grid Layout
- Configurable widget presets
- Real-time widget state synchronization
- Premium feature gating

### Recording Management

- Audio file upload with metadata
- Recording playback and streaming
- Search and filtering capabilities
- Musical key and notation system support

### Pitch Analysis

- Real-time pitch detection
- Batch analysis processing
- Note annotation system
- Statistical analysis and visualizations

### Subscription & Payment

- Tiered subscription management (Free, Premium, Pro)
- Usage tracking and limits
- Payment processing (Stripe-ready)
- Subscription history and billing

## 🎯 API Integration

The frontend integrates with the Express.js backend through:

### Service Layer Architecture

```typescript
// Example: Recording service
const recording = await recordingService.uploadRecording(file, metadata);
const recordings = await recordingService.getRecordings(page, limit);
```

### React Query Integration

```typescript
// Custom hooks for data fetching
const { data: recordings, isLoading } = useRecordings(page, limit);
const uploadMutation = useUploadRecording();
```

### Context-Based State Management

```typescript
// Widget management through context
const { widgets, addWidget, updateWidget } = useWidgets();
```

## 🎨 UI/UX Features

### Theme System

- Light/Dark mode toggle
- System preference detection
- Consistent color scheme across components

### Responsive Design

- Mobile-first responsive layouts
- Adaptive widget sizing
- Touch-friendly interactions

### Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility

## 🔧 Development Tools

### React Query DevTools

- Enabled in development mode
- Query inspection and debugging
- Cache management visualization

### Hot Reloading

- Fast refresh for component updates
- State preservation during development

### TypeScript Integration

- Full type safety
- Auto-completion and IntelliSense
- Compile-time error detection

## 🛠️ Available Scripts

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run test suite
npm run eject      # Eject from Create React App
npm run build:pwa  # Build Progressive Web App
```

## 🔐 Authentication Flow

1. **Login/Register**: User provides credentials
2. **Token Storage**: JWT tokens stored in secure cookies
3. **Auto-Refresh**: Access tokens automatically refreshed
4. **Route Protection**: Protected routes redirect to login
5. **Context Sync**: User state synchronized across app

## 📱 Progressive Web App

The frontend is configured as a PWA with:

- Service worker for offline functionality
- App manifest for installation
- Caching strategies for performance

## 🎵 Music-Specific Features

### Notation Systems

- ABC notation support
- Do-Re-Mi notation support
- Sharp/Flat accidental preferences

### Musical Key Support

- All 12 chromatic keys
- Key signature detection
- Transposition capabilities

### Audio Processing

- Real-time pitch detection with Pitchy.js
- RecordRTC for audio recording
- Web Audio API integration

## 🔄 State Management

### Context Providers

- **AuthContext**: User authentication and session management
- **ThemeContext**: UI theme and appearance settings
- **UserPreferencesContext**: Musical preferences and settings
- **WidgetContext**: Dashboard widget management

### React Query

- Server state caching and synchronization
- Background updates and refetching
- Optimistic updates for better UX

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Environment Variables for Production

```bash
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENV=production
REACT_APP_ENABLE_DEVTOOLS=false
```

### Static Hosting

The built app can be deployed to:

- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static hosting service

## 🔍 Debugging

### React Query DevTools

- Press Ctrl+Shift+R to toggle devtools
- Inspect queries, mutations, and cache
- Monitor network activity

### Browser DevTools

- Redux DevTools for debugging (if needed)
- React Developer Tools
- Network tab for API monitoring

## 📈 Performance

### Optimization Features

- Code splitting with React.lazy()
- Image optimization and lazy loading
- Bundle size analysis
- Service worker caching

### Monitoring

- Web Vitals tracking
- Performance metrics collection
- Error boundary implementation

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use React hooks and functional components
3. Implement proper error handling
4. Add appropriate loading states
5. Write meaningful component tests
6. Follow the established folder structure

## 📄 License

[Your License Here]
