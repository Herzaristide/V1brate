import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get user's widget configurations
router.get('/configs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const configs = await prisma.widgetConfig.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ zIndex: 'asc' }, { createdAt: 'asc' }],
    });

    res.json(configs);
  } catch (error) {
    console.error('Get widget configs error:', error);
    res.status(500).json({ error: 'Failed to fetch widget configurations' });
  }
});

// Create new widget configuration
router.post(
  '/configs',
  [
    body('widgetType').isIn([
      'tuner',
      'metronome',
      'pitchAnalyzer',
      'waveform',
      'frequencyAnalyzer',
      'musicalStaff',
      'recording',
      'droneNote',
      'clock',
      'pitchTest',
    ]),
    body('instanceId').notEmpty(),
    body('x').isFloat({ min: 0 }),
    body('y').isFloat({ min: 0 }),
    body('width').isFloat({ min: 100 }),
    body('height').isFloat({ min: 100 }),
    body('settings').optional().isObject(),
    body('musicalKey').optional().isLength({ min: 1, max: 10 }),
    body('isPremiumFeature').optional().isBoolean(),
    body('zIndex').optional().isInt({ min: 0 }),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        widgetType,
        instanceId,
        x,
        y,
        width,
        height,
        settings,
        musicalKey,
        isPremiumFeature,
        zIndex,
      } = req.body;

      // Check if instance already exists
      const existingConfig = await prisma.widgetConfig.findFirst({
        where: {
          userId: req.user!.id,
          instanceId,
        },
      });

      if (existingConfig) {
        return res
          .status(409)
          .json({ error: 'Widget instance already exists' });
      }

      // Check premium feature access
      if (isPremiumFeature) {
        const user = await prisma.user.findUnique({
          where: { id: req.user!.id },
          include: {
            subscription: {
              select: { tier: true, status: true },
            },
          },
        });

        if (
          !user?.subscription ||
          user.subscription.tier === 'free' ||
          user.subscription.status !== 'active'
        ) {
          return res
            .status(403)
            .json({ error: 'Premium subscription required for this widget' });
        }
      }

      const config = await prisma.widgetConfig.create({
        data: {
          userId: req.user!.id,
          widgetType,
          instanceId,
          x,
          y,
          width,
          height,
          settings: settings || {},
          musicalKey,
          isPremiumFeature: isPremiumFeature || false,
          zIndex,
        },
      });

      // Log activity
      await prisma.userActivity.create({
        data: {
          userId: req.user!.id,
          activityType: 'widget_create',
          resourceId: config.id,
          metadata: {
            widgetType,
            instanceId,
          },
        },
      });

      res.status(201).json(config);
    } catch (error) {
      console.error('Create widget config error:', error);
      res.status(500).json({ error: 'Failed to create widget configuration' });
    }
  }
);

// Update widget configuration
router.put(
  '/configs/:id',
  [
    body('x').optional().isFloat({ min: 0 }),
    body('y').optional().isFloat({ min: 0 }),
    body('width').optional().isFloat({ min: 100 }),
    body('height').optional().isFloat({ min: 100 }),
    body('settings').optional().isObject(),
    body('musicalKey').optional().isLength({ min: 1, max: 10 }),
    body('isVisible').optional().isBoolean(),
    body('isMinimized').optional().isBoolean(),
    body('zIndex').optional().isInt({ min: 0 }),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        x,
        y,
        width,
        height,
        settings,
        musicalKey,
        isVisible,
        isMinimized,
        zIndex,
      } = req.body;

      const config = await prisma.widgetConfig.updateMany({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
        data: {
          ...(x !== undefined && { x }),
          ...(y !== undefined && { y }),
          ...(width !== undefined && { width }),
          ...(height !== undefined && { height }),
          ...(settings !== undefined && { settings }),
          ...(musicalKey !== undefined && { musicalKey }),
          ...(isVisible !== undefined && { isVisible }),
          ...(isMinimized !== undefined && { isMinimized }),
          ...(zIndex !== undefined && { zIndex }),
        },
      });

      if (config.count === 0) {
        return res
          .status(404)
          .json({ error: 'Widget configuration not found' });
      }

      const updatedConfig = await prisma.widgetConfig.findUnique({
        where: { id: req.params.id },
      });

      // Log activity
      await prisma.userActivity.create({
        data: {
          userId: req.user!.id,
          activityType: 'widget_update',
          resourceId: req.params.id,
          metadata: { updatedFields: Object.keys(req.body) },
        },
      });

      res.json(updatedConfig);
    } catch (error) {
      console.error('Update widget config error:', error);
      res.status(500).json({ error: 'Failed to update widget configuration' });
    }
  }
);

// Delete widget configuration
router.delete(
  '/configs/:id',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const config = await prisma.widgetConfig.deleteMany({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
      });

      if (config.count === 0) {
        return res
          .status(404)
          .json({ error: 'Widget configuration not found' });
      }

      // Log activity
      await prisma.userActivity.create({
        data: {
          userId: req.user!.id,
          activityType: 'widget_delete',
          resourceId: req.params.id,
        },
      });

      res.json({ message: 'Widget configuration deleted successfully' });
    } catch (error) {
      console.error('Delete widget config error:', error);
      res.status(500).json({ error: 'Failed to delete widget configuration' });
    }
  }
);

// Get user's widget presets
router.get('/presets', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const includePublic = req.query.includePublic === 'true';

    const where = includePublic
      ? {
          OR: [{ userId: req.user!.id }, { isPublic: true }],
        }
      : { userId: req.user!.id };

    const presets = await prisma.widgetPreset.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        isDefault: true,
        isPublic: true,
        tags: true,
        usageCount: true,
        lastUsed: true,
        createdAt: true,
        user: includePublic
          ? {
              select: {
                username: true,
                displayName: true,
              },
            }
          : false,
      },
    });

    res.json(presets);
  } catch (error) {
    console.error('Get widget presets error:', error);
    res.status(500).json({ error: 'Failed to fetch widget presets' });
  }
});

// Get single widget preset with full configuration
router.get('/presets/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const preset = await prisma.widgetPreset.findFirst({
      where: {
        id: req.params.id,
        OR: [{ userId: req.user!.id }, { isPublic: true }],
      },
    });

    if (!preset) {
      return res.status(404).json({ error: 'Widget preset not found' });
    }

    res.json(preset);
  } catch (error) {
    console.error('Get widget preset error:', error);
    res.status(500).json({ error: 'Failed to fetch widget preset' });
  }
});

// Create new widget preset
router.post(
  '/presets',
  [
    body('name').isLength({ min: 1, max: 100 }),
    body('description').optional().isLength({ max: 500 }),
    body('widgetConfigs').isArray(),
    body('tags').optional().isArray(),
    body('isPublic').optional().isBoolean(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, widgetConfigs, tags, isPublic } = req.body;

      const preset = await prisma.widgetPreset.create({
        data: {
          userId: req.user!.id,
          name,
          description,
          widgetConfigs,
          tags: tags || [],
          isPublic: isPublic || false,
        },
        select: {
          id: true,
          name: true,
          description: true,
          isPublic: true,
          tags: true,
          createdAt: true,
        },
      });

      res.status(201).json(preset);
    } catch (error) {
      console.error('Create widget preset error:', error);
      res.status(500).json({ error: 'Failed to create widget preset' });
    }
  }
);

// Apply widget preset (load configuration)
router.post(
  '/presets/:id/apply',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const preset = await prisma.widgetPreset.findFirst({
        where: {
          id: req.params.id,
          OR: [{ userId: req.user!.id }, { isPublic: true }],
        },
      });

      if (!preset) {
        return res.status(404).json({ error: 'Widget preset not found' });
      }

      // Clear existing widgets (optional - based on query parameter)
      const clearExisting = req.query.clearExisting === 'true';
      if (clearExisting) {
        await prisma.widgetConfig.deleteMany({
          where: { userId: req.user!.id },
        });
      }

      // Apply preset configurations
      const widgetConfigs = preset.widgetConfigs as any[];
      const createdConfigs = [];

      for (const config of widgetConfigs) {
        // Generate new instance ID to avoid conflicts
        const instanceId = `${config.widgetType}-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const newConfig = await prisma.widgetConfig.create({
          data: {
            userId: req.user!.id,
            widgetType: config.widgetType,
            instanceId,
            x: config.x || 0,
            y: config.y || 0,
            width: config.width || 300,
            height: config.height || 200,
            settings: config.settings || {},
            musicalKey: config.musicalKey,
            isPremiumFeature: config.isPremiumFeature || false,
            zIndex: config.zIndex || 1,
          },
        });

        createdConfigs.push(newConfig);
      }

      // Update preset usage
      await prisma.widgetPreset.update({
        where: { id: req.params.id },
        data: {
          usageCount: { increment: 1 },
          lastUsed: new Date(),
        },
      });

      res.json({
        message: 'Preset applied successfully',
        configsCreated: createdConfigs.length,
        configs: createdConfigs,
      });
    } catch (error) {
      console.error('Apply widget preset error:', error);
      res.status(500).json({ error: 'Failed to apply widget preset' });
    }
  }
);

// Update widget preset
router.put(
  '/presets/:id',
  [
    body('name').optional().isLength({ min: 1, max: 100 }),
    body('description').optional().isLength({ max: 500 }),
    body('widgetConfigs').optional().isArray(),
    body('tags').optional().isArray(),
    body('isPublic').optional().isBoolean(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, widgetConfigs, tags, isPublic } = req.body;

      const preset = await prisma.widgetPreset.updateMany({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(widgetConfigs !== undefined && { widgetConfigs }),
          ...(tags !== undefined && { tags }),
          ...(isPublic !== undefined && { isPublic }),
        },
      });

      if (preset.count === 0) {
        return res.status(404).json({ error: 'Widget preset not found' });
      }

      const updatedPreset = await prisma.widgetPreset.findUnique({
        where: { id: req.params.id },
      });

      res.json(updatedPreset);
    } catch (error) {
      console.error('Update widget preset error:', error);
      res.status(500).json({ error: 'Failed to update widget preset' });
    }
  }
);

// Delete widget preset
router.delete(
  '/presets/:id',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const preset = await prisma.widgetPreset.deleteMany({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
      });

      if (preset.count === 0) {
        return res.status(404).json({ error: 'Widget preset not found' });
      }

      res.json({ message: 'Widget preset deleted successfully' });
    } catch (error) {
      console.error('Delete widget preset error:', error);
      res.status(500).json({ error: 'Failed to delete widget preset' });
    }
  }
);

export default router;
