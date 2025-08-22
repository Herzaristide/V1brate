import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@v1brate.com' },
    update: {},
    create: {
      email: 'demo@v1brate.com',
      username: 'demo',
      displayName: 'Demo User',
      password: hashedPassword,
      notationSystem: 'ABC',
    },
  });

  console.log('✅ Demo user created:', demoUser);

  // Create default widget configs for the demo user (replaces dashboardLayout)
  await prisma.widgetConfig.createMany({
    data: [
      {
        userId: demoUser.id,
        widgetType: 'pitchAnalyzer',
        instanceId: 'pitch-analyzer-1',
        musicalKey: 'C',
        x: 0,
        y: 0,
        width: 400,
        height: 300,
        settings: JSON.stringify({
          bufferSize: 250,
          showStaff: true,
          showCents: true,
        }),
        isVisible: true,
        isMinimized: false,
      },
      {
        userId: demoUser.id,
        widgetType: 'recording',
        instanceId: 'recording-1',
        musicalKey: 'C',
        x: 400,
        y: 0,
        width: 400,
        height: 300,
        settings: JSON.stringify({ autoSave: true, quality: 'high' }),
        isVisible: true,
        isMinimized: false,
      },
    ],
    skipDuplicates: true,
  });

  // Create a free subscription for the demo user
  await prisma.subscription.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      tier: 'free',
      status: 'active',
      maxRecordings: 10,
      maxStorageBytes: BigInt(1073741824),
      maxAnalysisTime: 3600,
    },
  });

  // Create some sample pitch analysis data
  const samplePitchData = {
    notes: [
      {
        timestamp: Date.now() - 5000,
        frequency: 261.63,
        note: 'C4',
        cents: 0,
        accuracy: 'perfect',
      },
      {
        timestamp: Date.now() - 4000,
        frequency: 293.66,
        note: 'D4',
        cents: 5,
        accuracy: 'good',
      },
      {
        timestamp: Date.now() - 3000,
        frequency: 329.63,
        note: 'E4',
        cents: -3,
        accuracy: 'good',
      },
      {
        timestamp: Date.now() - 2000,
        frequency: 349.23,
        note: 'F4',
        cents: 2,
        accuracy: 'good',
      },
      {
        timestamp: Date.now() - 1000,
        frequency: 392.0,
        note: 'G4',
        cents: 0,
        accuracy: 'perfect',
      },
    ],
    settings: {
      bufferSize: 250,
      musicalKey: 'C',
      notationSystem: 'ABC',
    },
  };

  const pitchAnalysis = await prisma.pitchAnalysis.create({
    data: {
      userId: demoUser.id,
      pitchData: samplePitchData,
      analysisType: 'realtime', // Changed from 'demo' to valid enum
      musicalKey: 'C',
      notationSystem: 'ABC',
      bufferSize: 250,
    },
  });

  console.log('✅ Sample pitch analysis created:', pitchAnalysis.id);

  // Create an admin user (developer)
  const adminPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@v1brate.com' },
    update: {},
    create: {
      email: 'admin@v1brate.com',
      username: 'admin',
      displayName: 'Admin User',
      password: adminPassword,
      role: 'admin',
      notationSystem: 'ABC',
      accidentalSystem: 'sharp',
      standartPitch: 440.0,
      isEmailVerified: true,
    },
  });

  console.log('✅ Admin user created:', adminUser);

  // Create admin subscription (pro tier)
  await prisma.subscription.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      tier: 'pro',
      status: 'active',
      maxRecordings: null, // Unlimited
      maxStorageBytes: null, // Unlimited
      maxAnalysisTime: null, // Unlimited
    },
  });

  // Create premium user
  const premiumPassword = await bcrypt.hash('premium123', 10);

  const premiumUser = await prisma.user.upsert({
    where: { email: 'premium@v1brate.com' },
    update: {},
    create: {
      email: 'premium@v1brate.com',
      username: 'premium',
      displayName: 'Premium User',
      password: premiumPassword,
      notationSystem: 'DoReMi',
      accidentalSystem: 'flat',
      standartPitch: 442.0,
      isEmailVerified: true,
    },
  });

  // Create premium subscription
  await prisma.subscription.upsert({
    where: { userId: premiumUser.id },
    update: {},
    create: {
      userId: premiumUser.id,
      tier: 'premium',
      status: 'active',
      maxRecordings: 100,
      maxStorageBytes: BigInt(10737418240), // 10GB
      maxAnalysisTime: 36000, // 10 hours
    },
  });

  // Create premium widget configs for premium user
  await prisma.widgetConfig.createMany({
    data: [
      {
        userId: premiumUser.id,
        widgetType: 'tuner',
        instanceId: 'tuner-1',
        musicalKey: 'A',
        x: 0,
        y: 0,
        width: 350,
        height: 400,
        settings: JSON.stringify({ sensitivity: 0.8, tuningStandard: 442 }),
        isVisible: true,
        isMinimized: false,
      },
      {
        userId: premiumUser.id,
        widgetType: 'frequencyAnalyzer',
        instanceId: 'freq-analyzer-1',
        musicalKey: 'C',
        x: 360,
        y: 0,
        width: 450,
        height: 350,
        settings: JSON.stringify({ fftSize: 2048, smoothing: 0.8 }),
        isVisible: true,
        isMinimized: false,
        isPremiumFeature: true,
      },
      {
        userId: premiumUser.id,
        widgetType: 'musicalStaff',
        instanceId: 'staff-1',
        musicalKey: 'G',
        x: 0,
        y: 410,
        width: 500,
        height: 200,
        settings: JSON.stringify({ clef: 'treble', showKeySignature: true }),
        isVisible: true,
        isMinimized: false,
        isPremiumFeature: true,
      },
    ],
    skipDuplicates: true,
  });

  // Create sample recordings
  const demoRecording = await prisma.recording.create({
    data: {
      userId: demoUser.id,
      filename: 'demo_practice_session.webm',
      originalName: 'Practice Session - C Major Scale.webm',
      mimeType: 'audio/webm',
      size: BigInt(2048576), // 2MB
      duration: 120.5, // 2 minutes
      audioPath: '/uploads/recordings/demo_practice_session.webm',
      title: 'C Major Scale Practice',
      description: 'Practicing C major scale with metronome',
      musicalKey: 'C',
      sampleRate: 44100,
      bitRate: 128,
      channels: 1,
      processingStatus: 'completed',
    },
  });

  const premiumRecording = await prisma.recording.create({
    data: {
      userId: premiumUser.id,
      filename: 'premium_analysis.webm',
      originalName: 'Advanced Pitch Analysis.webm',
      mimeType: 'audio/webm',
      size: BigInt(5242880), // 5MB
      duration: 300.0, // 5 minutes
      audioPath: '/uploads/recordings/premium_analysis.webm',
      title: 'Advanced Pitch Analysis',
      description: 'Complex musical piece with multiple instruments',
      musicalKey: 'F#',
      sampleRate: 48000,
      bitRate: 192,
      channels: 2,
      processingStatus: 'completed',
    },
  });

  // Create recording stats
  await prisma.recordingStat.createMany({
    data: [
      {
        recordingId: demoRecording.id,
        averageAccuracy: 0.85,
        noteCount: 24,
        duration: 120.5,
        peakFrequency: 523.25, // C5
      },
      {
        recordingId: premiumRecording.id,
        averageAccuracy: 0.92,
        noteCount: 156,
        duration: 300.0,
        peakFrequency: 1174.66, // D6
      },
    ],
    skipDuplicates: true,
  });

  // Create notes and bookmarks
  await prisma.note.createMany({
    data: [
      {
        userId: demoUser.id,
        recordingId: demoRecording.id,
        time: 15.5,
        text: 'Good intonation on this note',
      },
      {
        userId: demoUser.id,
        recordingId: demoRecording.id,
        time: 45.2,
        text: 'Slight sharp on F note',
      },
      {
        userId: premiumUser.id,
        recordingId: premiumRecording.id,
        time: 120.0,
        text: 'Beautiful harmonic progression here',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.bookmark.createMany({
    data: [
      {
        userId: demoUser.id,
        recordingId: demoRecording.id,
        time: 0.0,
        label: 'Start of scale',
      },
      {
        userId: demoUser.id,
        recordingId: demoRecording.id,
        time: 60.0,
        label: 'Halfway point',
      },
      {
        userId: premiumUser.id,
        recordingId: premiumRecording.id,
        time: 180.0,
        label: 'Key change section',
      },
    ],
    skipDuplicates: true,
  });

  // Create user activities
  await prisma.userActivity.createMany({
    data: [
      {
        userId: demoUser.id,
        activityType: 'login',
        metadata: JSON.stringify({ device: 'desktop', browser: 'chrome' }),
      },
      {
        userId: demoUser.id,
        activityType: 'recording',
        duration: 120,
        resourceId: demoRecording.id,
        metadata: JSON.stringify({ quality: 'high', duration: 120.5 }),
      },
      {
        userId: demoUser.id,
        activityType: 'analysis',
        duration: 45,
        resourceId: pitchAnalysis.id,
        metadata: JSON.stringify({ type: 'realtime', accuracy: 0.85 }),
      },
      {
        userId: premiumUser.id,
        activityType: 'login',
        metadata: JSON.stringify({ device: 'mobile', browser: 'safari' }),
      },
      {
        userId: premiumUser.id,
        activityType: 'widget_create',
        resourceId: 'freq-analyzer-1',
        metadata: JSON.stringify({ widgetType: 'frequencyAnalyzer' }),
      },
      {
        userId: adminUser.id,
        activityType: 'login',
        metadata: JSON.stringify({
          device: 'desktop',
          browser: 'firefox',
          admin: true,
        }),
      },
    ],
    skipDuplicates: true,
  });

  // Create widget presets
  const demoPreset = await prisma.widgetPreset.create({
    data: {
      userId: demoUser.id,
      name: 'Basic Practice Setup',
      description: 'Simple layout for practice sessions',
      widgetConfigs: JSON.stringify([
        {
          widgetType: 'tuner',
          musicalKey: 'C',
          settings: { sensitivity: 0.5 },
          x: 0,
          y: 0,
          width: 300,
          height: 400,
        },
        {
          widgetType: 'metronome',
          musicalKey: 'C',
          settings: { bpm: 120, timeSignature: '4/4' },
          x: 310,
          y: 0,
          width: 300,
          height: 400,
        },
      ]),
      isDefault: true,
      isPublic: true,
      tags: ['beginner', 'practice', 'basic'],
    },
  });

  const premiumPreset = await prisma.widgetPreset.create({
    data: {
      userId: premiumUser.id,
      name: 'Advanced Analysis Studio',
      description: 'Professional setup for detailed analysis',
      widgetConfigs: JSON.stringify([
        {
          widgetType: 'frequencyAnalyzer',
          musicalKey: 'C',
          settings: { fftSize: 4096 },
          x: 0,
          y: 0,
          width: 400,
          height: 300,
        },
        {
          widgetType: 'musicalStaff',
          musicalKey: 'C',
          settings: { clef: 'treble' },
          x: 410,
          y: 0,
          width: 400,
          height: 300,
        },
        {
          widgetType: 'pitchTest',
          musicalKey: 'C',
          settings: { difficulty: 'advanced' },
          x: 0,
          y: 310,
          width: 400,
          height: 300,
        },
      ]),
      isDefault: false,
      isPublic: true,
      tags: ['premium', 'advanced', 'analysis', 'professional'],
    },
  });

  // Create sample payment for premium user
  await prisma.payment.create({
    data: {
      userId: premiumUser.id,
      subscriptionId: (await prisma.subscription.findUnique({
        where: { userId: premiumUser.id },
      }))!.id,
      amount: 9.99,
      currency: 'USD',
      status: 'completed',
      description: 'Premium subscription - Monthly',
      externalId: 'pi_1234567890',
      externalStatus: 'succeeded',
      metadata: JSON.stringify({
        plan: 'premium_monthly',
        billing_cycle: 'monthly',
      }),
      paidAt: new Date(),
    },
  });

  console.log('✅ Sample recordings created:', {
    demoRecording: demoRecording.id,
    premiumRecording: premiumRecording.id,
  });
  console.log('✅ Widget presets created:', {
    demoPreset: demoPreset.id,
    premiumPreset: premiumPreset.id,
  });
  console.log(
    '✅ Additional sample data created (notes, bookmarks, activities, payment)',
  );

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
