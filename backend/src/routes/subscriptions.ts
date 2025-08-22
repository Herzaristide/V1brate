import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get user's subscription
router.get('/me', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.id },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            description: true,
            createdAt: true,
            paidAt: true,
          },
        },
      },
    });

    if (!subscription) {
      // Create default free subscription
      const newSubscription = await prisma.subscription.create({
        data: {
          userId: req.user!.id,
          tier: 'free',
          status: 'active',
        },
        include: {
          payments: true,
        },
      });
      return res.json(newSubscription);
    }

    res.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Get subscription usage/limits
router.get('/me/usage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.id },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Calculate current usage
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const usage = await Promise.all([
      // Recording count
      prisma.recording.count({
        where: {
          userId: req.user!.id,
          deletedAt: null,
        },
      }),
      // Storage usage
      prisma.recording.aggregate({
        where: {
          userId: req.user!.id,
          deletedAt: null,
        },
        _sum: {
          size: true,
        },
      }),
      // Analysis time this month (approximate based on recordings)
      prisma.pitchAnalysis.count({
        where: {
          userId: req.user!.id,
          createdAt: {
            gte: currentMonth,
          },
        },
      }),
    ]);

    const [recordingCount, storageSum, analysisCount] = usage;

    res.json({
      recordings: {
        current: recordingCount,
        limit: subscription.maxRecordings,
        unlimited: subscription.maxRecordings === null,
      },
      storage: {
        currentBytes: storageSum._sum.size || 0,
        limitBytes: subscription.maxStorageBytes,
        unlimited: subscription.maxStorageBytes === null,
      },
      analysis: {
        currentThisMonth: analysisCount,
        limitPerMonth: subscription.maxAnalysisTime,
        unlimited: subscription.maxAnalysisTime === null,
      },
    });
  } catch (error) {
    console.error('Get subscription usage error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription usage' });
  }
});

// Update subscription tier
router.put(
  '/me',
  [
    body('tier').isIn(['free', 'premium', 'pro']),
    body('externalId').optional().isString(),
    body('externalCustomerId').optional().isString(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { tier, externalId, externalCustomerId } = req.body;

      // Set limits based on tier
      let limits = {};
      switch (tier) {
        case 'free':
          limits = {
            maxRecordings: 10,
            maxStorageBytes: BigInt(1073741824), // 1GB
            maxAnalysisTime: 3600, // 1 hour per month
          };
          break;
        case 'premium':
          limits = {
            maxRecordings: 100,
            maxStorageBytes: BigInt(10737418240), // 10GB
            maxAnalysisTime: 36000, // 10 hours per month
          };
          break;
        case 'pro':
          limits = {
            maxRecordings: null, // unlimited
            maxStorageBytes: null, // unlimited
            maxAnalysisTime: null, // unlimited
          };
          break;
      }

      const subscription = await prisma.subscription.upsert({
        where: { userId: req.user!.id },
        update: {
          tier,
          status: 'active',
          externalId,
          externalCustomerId,
          ...limits,
        },
        create: {
          userId: req.user!.id,
          tier,
          status: 'active',
          externalId,
          externalCustomerId,
          ...limits,
        },
      });

      res.json(subscription);
    } catch (error) {
      console.error('Update subscription error:', error);
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  }
);

// Cancel subscription
router.post('/me/cancel', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.id },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.status === 'canceled') {
      return res.status(400).json({ error: 'Subscription already canceled' });
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { userId: req.user!.id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });

    res.json({
      message: 'Subscription canceled successfully',
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Reactivate subscription
router.post(
  '/me/reactivate',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: req.user!.id },
      });

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      if (subscription.status === 'active') {
        return res.status(400).json({ error: 'Subscription already active' });
      }

      const updatedSubscription = await prisma.subscription.update({
        where: { userId: req.user!.id },
        data: {
          status: 'active',
          canceledAt: null,
        },
      });

      res.json({
        message: 'Subscription reactivated successfully',
        subscription: updatedSubscription,
      });
    } catch (error) {
      console.error('Reactivate subscription error:', error);
      res.status(500).json({ error: 'Failed to reactivate subscription' });
    }
  }
);

// Get subscription plans (static data)
router.get('/plans', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: [
          '10 recordings',
          '1GB storage',
          '1 hour analysis per month',
          'Basic widgets',
          'Community support',
        ],
        limits: {
          maxRecordings: 10,
          maxStorageGB: 1,
          maxAnalysisHours: 1,
        },
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: [
          '100 recordings',
          '10GB storage',
          '10 hours analysis per month',
          'All widgets',
          'Priority support',
          'Advanced analytics',
        ],
        limits: {
          maxRecordings: 100,
          maxStorageGB: 10,
          maxAnalysisHours: 10,
        },
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 29.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Unlimited recordings',
          'Unlimited storage',
          'Unlimited analysis',
          'All widgets',
          'Priority support',
          'Advanced analytics',
          'API access',
          'Custom integrations',
        ],
        limits: {
          maxRecordings: null,
          maxStorageGB: null,
          maxAnalysisHours: null,
        },
      },
    ];

    res.json(plans);
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

export default router;
