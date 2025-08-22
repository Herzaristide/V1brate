import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get pitch analyses
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    const recordingId = req.query.recordingId as string;
    const analysisType = req.query.analysisType as string;
    const musicalKey = req.query.musicalKey as string;

    const where = {
      userId: req.user!.id,
      ...(recordingId && { recordingId }),
      ...(analysisType && { analysisType }),
      ...(musicalKey && { musicalKey }),
    };

    const analyses = await prisma.pitchAnalysis.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        recordingId: true,
        analysisType: true,
        musicalKey: true,
        notationSystem: true,
        bufferSize: true,
        sampleRate: true,
        algorithm: true,
        confidence: true,
        dataPoints: true,
        createdAt: true,
        recording: {
          select: {
            id: true,
            title: true,
            originalName: true,
            duration: true,
          },
        },
        _count: {
          select: {
            notes: true,
          },
        },
      },
    });

    const totalCount = await prisma.pitchAnalysis.count({ where });

    res.json({
      analyses,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Get pitch analyses error:', error);
    res.status(500).json({ error: 'Failed to fetch pitch analyses' });
  }
});

// Get single pitch analysis with full data
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analysis = await prisma.pitchAnalysis.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        recording: {
          select: {
            id: true,
            title: true,
            originalName: true,
            duration: true,
            musicalKey: true,
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
      },
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Pitch analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Get pitch analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch pitch analysis' });
  }
});

// Create new pitch analysis
router.post(
  '/',
  [
    body('recordingId').optional().isUUID(),
    body('pitchData').isArray(),
    body('analysisType').isIn(['realtime', 'recording', 'batch']),
    body('musicalKey').optional().isLength({ min: 1, max: 10 }),
    body('notationSystem').optional().isIn(['ABC', 'DoReMi']),
    body('bufferSize').optional().isInt({ min: 64, max: 8192 }),
    body('sampleRate').optional().isInt({ min: 8000, max: 192000 }),
    body('algorithm').optional().isIn(['yin', 'fft', 'autocorrelation']),
    body('windowFunction').optional().isIn(['hanning', 'hamming', 'blackman']),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        recordingId,
        pitchData,
        analysisType,
        musicalKey,
        notationSystem,
        bufferSize,
        sampleRate,
        algorithm,
        windowFunction,
      } = req.body;

      // Validate recording ownership if recordingId is provided
      if (recordingId) {
        const recording = await prisma.recording.findFirst({
          where: {
            id: recordingId,
            userId: req.user!.id,
            deletedAt: null,
          },
        });

        if (!recording) {
          return res.status(404).json({ error: 'Recording not found' });
        }
      }

      // Calculate confidence and data points from pitch data
      const dataPoints = Array.isArray(pitchData) ? pitchData.length : 0;
      const confidence =
        Array.isArray(pitchData) && pitchData.length > 0
          ? pitchData.reduce(
              (sum: number, point: any) => sum + (point.confidence || 0),
              0
            ) / pitchData.length
          : null;

      const analysis = await prisma.pitchAnalysis.create({
        data: {
          userId: req.user!.id,
          recordingId,
          pitchData,
          analysisType,
          musicalKey,
          notationSystem,
          bufferSize,
          sampleRate,
          algorithm,
          windowFunction,
          confidence,
          dataPoints,
        },
        select: {
          id: true,
          recordingId: true,
          analysisType: true,
          musicalKey: true,
          notationSystem: true,
          confidence: true,
          dataPoints: true,
          createdAt: true,
        },
      });

      // Log activity
      await prisma.userActivity.create({
        data: {
          userId: req.user!.id,
          activityType: 'analysis',
          resourceId: analysis.id,
          metadata: {
            analysisType,
            dataPoints,
            recordingId,
          },
        },
      });

      res.status(201).json(analysis);
    } catch (error) {
      console.error('Create pitch analysis error:', error);
      res.status(500).json({ error: 'Failed to create pitch analysis' });
    }
  }
);

// Update pitch analysis
router.put(
  '/:id',
  [
    body('musicalKey').optional().isLength({ min: 1, max: 10 }),
    body('notationSystem').optional().isIn(['ABC', 'DoReMi']),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { musicalKey, notationSystem } = req.body;

      const analysis = await prisma.pitchAnalysis.updateMany({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
        data: {
          ...(musicalKey !== undefined && { musicalKey }),
          ...(notationSystem !== undefined && { notationSystem }),
        },
      });

      if (analysis.count === 0) {
        return res.status(404).json({ error: 'Pitch analysis not found' });
      }

      const updatedAnalysis = await prisma.pitchAnalysis.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          musicalKey: true,
          notationSystem: true,
          updatedAt: true,
        },
      });

      res.json(updatedAnalysis);
    } catch (error) {
      console.error('Update pitch analysis error:', error);
      res.status(500).json({ error: 'Failed to update pitch analysis' });
    }
  }
);

// Delete pitch analysis
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analysis = await prisma.pitchAnalysis.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (analysis.count === 0) {
      return res.status(404).json({ error: 'Pitch analysis not found' });
    }

    res.json({ message: 'Pitch analysis deleted successfully' });
  } catch (error) {
    console.error('Delete pitch analysis error:', error);
    res.status(500).json({ error: 'Failed to delete pitch analysis' });
  }
});

// Add note to pitch analysis
router.post(
  '/:id/notes',
  [
    body('time').optional().isFloat({ min: 0 }),
    body('text').notEmpty().isLength({ min: 1, max: 1000 }),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verify analysis ownership
      const analysis = await prisma.pitchAnalysis.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
      });

      if (!analysis) {
        return res.status(404).json({ error: 'Pitch analysis not found' });
      }

      const { time, text } = req.body;

      const note = await prisma.note.create({
        data: {
          userId: req.user!.id,
          pitchAnalysisId: req.params.id,
          time,
          text,
        },
        select: {
          id: true,
          time: true,
          text: true,
          createdAt: true,
        },
      });

      res.status(201).json(note);
    } catch (error) {
      console.error('Add note error:', error);
      res.status(500).json({ error: 'Failed to add note' });
    }
  }
);

// Get pitch analysis statistics
router.get('/:id/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analysis = await prisma.pitchAnalysis.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      select: {
        pitchData: true,
        confidence: true,
        dataPoints: true,
        musicalKey: true,
      },
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Pitch analysis not found' });
    }

    // Calculate statistics from pitch data
    const pitchData = analysis.pitchData as any[];
    const frequencies = pitchData
      .filter((point) => point.frequency && point.frequency > 0)
      .map((point) => point.frequency);

    const stats = {
      totalDataPoints: analysis.dataPoints,
      confidence: analysis.confidence,
      musicalKey: analysis.musicalKey,
      frequencyRange:
        frequencies.length > 0
          ? {
              min: Math.min(...frequencies),
              max: Math.max(...frequencies),
              average:
                frequencies.reduce((sum, freq) => sum + freq, 0) /
                frequencies.length,
            }
          : null,
      noteDistribution: {} as Record<string, number>,
    };

    // Calculate note distribution
    pitchData.forEach((point) => {
      if (point.note) {
        stats.noteDistribution[point.note] =
          (stats.noteDistribution[point.note] || 0) + 1;
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Get pitch analysis stats error:', error);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

export default router;
