import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'recordings');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '50') * 1024 * 1024, // 50MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/mpeg',
      'audio/wav',
      'audio/mp3',
      'audio/ogg',
      'audio/webm',
      'audio/flac',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

// Get user's recordings
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const musicalKey = req.query.musicalKey as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    const where = {
      userId: req.user!.id,
      deletedAt: null,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { originalName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(musicalKey && { musicalKey }),
    };

    const recordings = await prisma.recording.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: limit,
      select: {
        id: true,
        filename: true,
        originalName: true,
        title: true,
        description: true,
        musicalKey: true,
        duration: true,
        size: true,
        mimeType: true,
        sampleRate: true,
        bitRate: true,
        channels: true,
        processingStatus: true,
        createdAt: true,
        updatedAt: true,
        recordingStat: {
          select: {
            averageAccuracy: true,
            noteCount: true,
            peakFrequency: true,
          },
        },
        _count: {
          select: {
            pitchAnalyses: true,
            notes: true,
            bookmarks: true,
          },
        },
      },
    });

    const totalCount = await prisma.recording.count({ where });

    res.json({
      recordings,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Get recordings error:', error);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

// Get single recording
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const recording = await prisma.recording.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
        deletedAt: null,
      },
      include: {
        recordingStat: true,
        pitchAnalyses: {
          select: {
            id: true,
            analysisType: true,
            musicalKey: true,
            confidence: true,
            dataPoints: true,
            createdAt: true,
          },
        },
        notes: {
          select: {
            id: true,
            time: true,
            text: true,
            createdAt: true,
          },
          orderBy: { time: 'asc' },
        },
        bookmarks: {
          select: {
            id: true,
            time: true,
            label: true,
            createdAt: true,
          },
          orderBy: { time: 'asc' },
        },
      },
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    res.json(recording);
  } catch (error) {
    console.error('Get recording error:', error);
    res.status(500).json({ error: 'Failed to fetch recording' });
  }
});

// Upload new recording
router.post(
  '/',
  upload.single('audio'),
  [
    body('title').optional().isLength({ min: 1, max: 100 }),
    body('description').optional().isLength({ max: 500 }),
    body('musicalKey').optional().isLength({ min: 1, max: 10 }),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      const { title, description, musicalKey } = req.body;

      const recording = await prisma.recording.create({
        data: {
          userId: req.user!.id,
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: BigInt(req.file.size),
          audioPath: req.file.path,
          title: title || req.file.originalname,
          description,
          musicalKey,
          processingStatus: 'uploaded',
        },
        select: {
          id: true,
          filename: true,
          originalName: true,
          title: true,
          description: true,
          musicalKey: true,
          size: true,
          mimeType: true,
          processingStatus: true,
          createdAt: true,
        },
      });

      // Log activity
      await prisma.userActivity.create({
        data: {
          userId: req.user!.id,
          activityType: 'recording',
          resourceId: recording.id,
          metadata: {
            filename: recording.filename,
            size: req.file.size,
          },
        },
      });

      res.status(201).json(recording);
    } catch (error) {
      console.error('Upload recording error:', error);
      // Clean up uploaded file if database operation failed
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to clean up uploaded file:', unlinkError);
        }
      }
      res.status(500).json({ error: 'Failed to upload recording' });
    }
  }
);

// Update recording metadata
router.put(
  '/:id',
  [
    body('title').optional().isLength({ min: 1, max: 100 }),
    body('description').optional().isLength({ max: 500 }),
    body('musicalKey').optional().isLength({ min: 1, max: 10 }),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, musicalKey } = req.body;

      const recording = await prisma.recording.updateMany({
        where: {
          id: req.params.id,
          userId: req.user!.id,
          deletedAt: null,
        },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(musicalKey !== undefined && { musicalKey }),
        },
      });

      if (recording.count === 0) {
        return res.status(404).json({ error: 'Recording not found' });
      }

      const updatedRecording = await prisma.recording.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          title: true,
          description: true,
          musicalKey: true,
          updatedAt: true,
        },
      });

      res.json(updatedRecording);
    } catch (error) {
      console.error('Update recording error:', error);
      res.status(500).json({ error: 'Failed to update recording' });
    }
  }
);

// Delete recording (soft delete)
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const recording = await prisma.recording.updateMany({
      where: {
        id: req.params.id,
        userId: req.user!.id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (recording.count === 0) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    res.json({ message: 'Recording deleted successfully' });
  } catch (error) {
    console.error('Delete recording error:', error);
    res.status(500).json({ error: 'Failed to delete recording' });
  }
});

// Stream recording audio
router.get('/:id/stream', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const recording = await prisma.recording.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
        deletedAt: null,
      },
      select: {
        audioPath: true,
        mimeType: true,
        originalName: true,
      },
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    // Check if file exists
    try {
      await fs.access(recording.audioPath);
    } catch {
      return res.status(404).json({ error: 'Audio file not found on disk' });
    }

    res.setHeader('Content-Type', recording.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${recording.originalName}"`
    );

    // Use Express's sendFile for efficient streaming
    res.sendFile(path.resolve(recording.audioPath));
  } catch (error) {
    console.error('Stream recording error:', error);
    res.status(500).json({ error: 'Failed to stream recording' });
  }
});

export default router;
