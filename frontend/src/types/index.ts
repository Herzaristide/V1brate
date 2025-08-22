// User types
export interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  imageUrl?: string;
  role: 'user' | 'admin';
  notationSystem: 'ABC' | 'DoReMi';
  accidentalSystem: 'sharp' | 'flat';
  standartPitch: number;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
  subscription?: {
    tier: 'free' | 'premium' | 'pro';
    status: 'active' | 'canceled' | 'expired' | 'trial' | 'pending';
    endDate?: string;
  };
}

export interface UserPreferences {
  notationSystem: 'ABC' | 'DoReMi';
  accidentalSystem: 'sharp' | 'flat';
  standartPitch: number;
}

export interface UserStats {
  counts: {
    recordings: number;
    pitchAnalyses: number;
    notes: number;
    bookmarks: number;
    widgetConfigs: number;
  };
  totalDuration: number;
  totalStorageBytes: number;
  recentActivity: UserActivity[];
}

export interface UserActivity {
  id: string;
  activityType:
    | 'login'
    | 'logout'
    | 'recording'
    | 'analysis'
    | 'practice'
    | 'widget_create'
    | 'widget_update'
    | 'widget_delete';
  duration?: number;
  metadata?: any;
  resourceId?: string;
  createdAt: string;
}

// Authentication types
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}

// Dashboard and Widget types
export interface WidgetConfig {
  id: string;
  widgetType:
    | 'tuner'
    | 'metronome'
    | 'pitchAnalyzer'
    | 'waveform'
    | 'frequencyAnalyzer'
    | 'musicalStaff'
    | 'staffAnalyzer'
    | 'recording'
    | 'droneNote'
    | 'clock'
    | 'pitchTest';
  instanceId: string;
  isPremiumFeature: boolean;
  musicalKey?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  settings: WidgetSettings;
  isVisible: boolean;
  isMinimized: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetPreset {
  id: string;
  name: string;
  description?: string;
  widgetConfigs: any[]; // Array of widget configurations
  isDefault: boolean;
  isPublic: boolean;
  tags: string[];
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    username?: string;
    displayName?: string;
  };
}

export interface Widget {
  id: string;
  type: WidgetConfig['widgetType'];
  x: number;
  y: number;
  w: number;
  h: number;
  settings: WidgetSettings;
}

export interface WidgetSettings {
  [key: string]: any;
}

export interface DashboardLayout {
  widgets: Widget[];
}

// Pitch Analysis types
export interface PitchPoint {
  timestamp: number;
  frequency: number;
  note: string;
  cents: number;
  confidence: number;
  octave: number;
}

export interface PitchAnalysis {
  id: string;
  userId: string;
  recordingId?: string;
  pitchData: PitchPoint[]; // Array of pitch points
  analysisType: 'realtime' | 'recording' | 'batch';
  musicalKey?: string;
  notationSystem: 'ABC' | 'DoReMi';
  bufferSize: number;
  sampleRate?: number;
  algorithm?: string;
  windowFunction?: string;
  confidence?: number;
  dataPoints?: number;
  createdAt: string;
  updatedAt: string;
  recording?: Recording;
  notes?: Note[];
}

export interface Note {
  id: string;
  time?: number;
  text: string;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  time: number;
  label?: string;
  createdAt: string;
}

// Recording types
export interface Recording {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  duration?: number;
  audioPath: string;
  title?: string;
  description?: string;
  musicalKey?: string;
  sampleRate?: number;
  bitRate?: number;
  channels?: number;
  processingStatus: 'uploaded' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  recordingStat?: {
    averageAccuracy?: number;
    noteCount?: number;
    peakFrequency?: number;
  };
  pitchAnalyses?: PitchAnalysis[];
  notes?: Note[];
  bookmarks?: Bookmark[];
  _count?: {
    pitchAnalyses: number;
    notes: number;
    bookmarks: number;
  };
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  tier: 'free' | 'premium' | 'pro';
  status: 'active' | 'canceled' | 'expired' | 'trial' | 'pending';
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
  canceledAt?: string;
  externalId?: string;
  externalCustomerId?: string;
  maxRecordings?: number;
  maxStorageBytes?: number;
  maxAnalysisTime?: number;
  createdAt: string;
  updatedAt: string;
  payments?: Payment[];
}

export interface SubscriptionUsage {
  recordings: {
    current: number;
    limit?: number;
    unlimited: boolean;
  };
  storage: {
    currentBytes: number;
    limitBytes?: number;
    unlimited: boolean;
  };
  analysis: {
    currentThisMonth: number;
    limitPerMonth?: number;
    unlimited: boolean;
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limits: {
    maxRecordings?: number;
    maxStorageGB?: number;
    maxAnalysisHours?: number;
  };
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description?: string;
  externalId?: string;
  externalStatus?: string;
  createdAt: string;
  paidAt?: string;
  subscription?: {
    id: string;
    tier: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  data?: T[];
  recordings?: T[]; // For recordings endpoint
  analyses?: T[]; // For pitch analysis endpoint
  payments?: T[]; // For payments endpoint
  activities?: T[]; // For activities endpoint
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Musical types
export type MusicalKey =
  | 'C'
  | 'C#'
  | 'Db'
  | 'D'
  | 'D#'
  | 'Eb'
  | 'E'
  | 'F'
  | 'F#'
  | 'Gb'
  | 'G'
  | 'G#'
  | 'Ab'
  | 'A'
  | 'A#'
  | 'Bb'
  | 'B';

export type NotationSystem = 'ABC' | 'DoReMi';

export const MUSICAL_KEYS: MusicalKey[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

export const NOTE_NAMES_ABC = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];
export const NOTE_NAMES_DOREMI = [
  'Do',
  'Do#',
  'Re',
  'Re#',
  'Mi',
  'Fa',
  'Fa#',
  'Sol',
  'Sol#',
  'La',
  'La#',
  'Ti',
];

// DoReMi notation mapping for both sharp and flat accidentals
export const NOTE_NAMES_DOREMI_MAP: { [key: string]: string } = {
  C: 'Do',
  'C#': 'Do#',
  Db: 'Reb',
  D: 'Re',
  'D#': 'Re#',
  Eb: 'Mib',
  E: 'Mi',
  F: 'Fa',
  'F#': 'Fa#',
  Gb: 'Solb',
  G: 'Sol',
  'G#': 'Sol#',
  Ab: 'Lab',
  A: 'La',
  'A#': 'La#',
  Bb: 'Tib',
  B: 'Ti',
};

// Widget-specific types
export interface PitchAnalyzerSettings {
  bufferSize: number;
  showStaff: boolean;
  showCents: boolean;
  sensitivity: number;
  autoScroll: boolean;
}

export interface RecordingSettings {
  autoSave: boolean;
  quality: 'low' | 'medium' | 'high';
  format: 'wav' | 'mp3';
  includeAnalysis: boolean;
}
