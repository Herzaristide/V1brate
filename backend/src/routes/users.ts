import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get current user profile
router.get('/me', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        imageUrl: true,
        role: true,
        notationSystem: true,
        accidentalSystem: true,
        standartPitch: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        lastLogin: true,
        subscription: {
          select: {
            tier: true,
            status: true,
            endDate: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
router.put(
  '/me',
  [
    body('username').optional().isLength({ min: 3, max: 30 }),
    body('displayName').optional().isLength({ min: 1, max: 50 }),
    body('notationSystem').optional().isIn(['ABC', 'DoReMi']),
    body('accidentalSystem').optional().isIn(['sharp', 'flat']),
    body('standartPitch').optional().isFloat({ min: 220, max: 880 }),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        username,
        displayName,
        notationSystem,
        accidentalSystem,
        standartPitch,
      } = req.body;

      // Check if username is already taken (if provided)
      if (username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username,
            id: { not: req.user!.id },
          },
        });

        if (existingUser) {
          return res.status(409).json({ error: 'Username already taken' });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(username !== undefined && { username }),
          ...(displayName !== undefined && { displayName }),
          ...(notationSystem !== undefined && { notationSystem }),
          ...(accidentalSystem !== undefined && { accidentalSystem }),
          ...(standartPitch !== undefined && { standartPitch }),
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          imageUrl: true,
          role: true,
          notationSystem: true,
          accidentalSystem: true,
          standartPitch: true,
          updatedAt: true,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

// Get user statistics
router.get('/me/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const stats = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            recordings: {
              where: { deletedAt: null },
            },
            pitchAnalyses: true,
            notes: true,
            bookmarks: true,
            widgetConfigs: true,
          },
        },
      },
    });

    // Get total recording duration and storage used
    const recordingStats = await prisma.recording.aggregate({
      where: {
        userId,
        deletedAt: null,
      },
      _sum: {
        duration: true,
        size: true,
      },
    });

    // Get recent activity
    const recentActivity = await prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        activityType: true,
        duration: true,
        createdAt: true,
      },
    });

    res.json({
      counts: stats?._count || {},
      totalDuration: recordingStats._sum.duration || 0,
      totalStorageBytes: recordingStats._sum.size || 0,
      recentActivity,
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get user activities
router.get(
  '/me/activities',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;

      const activities = await prisma.userActivity.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          activityType: true,
          duration: true,
          metadata: true,
          resourceId: true,
          createdAt: true,
        },
      });

      const totalCount = await prisma.userActivity.count({
        where: { userId: req.user!.id },
      });

      res.json({
        activities,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      console.error('Get user activities error:', error);
      res.status(500).json({ error: 'Failed to fetch user activities' });
    }
  }
);

// Delete user account
router.delete('/me', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Soft delete recordings first
    await prisma.recording.updateMany({
      where: { userId },
      data: { deletedAt: new Date() },
    });

    // Delete user (cascade will handle related records)
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId,
        activityType: 'logout',
        metadata: { reason: 'account_deletion' },
      },
    });

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
