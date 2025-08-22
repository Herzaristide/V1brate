import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get user's payment history
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    const where = {
      userId: req.user!.id,
      ...(status && { status }),
    };

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        description: true,
        externalId: true,
        externalStatus: true,
        createdAt: true,
        paidAt: true,
        subscription: {
          select: {
            id: true,
            tier: true,
          },
        },
      },
    });

    const totalCount = await prisma.payment.count({ where });

    res.json({
      payments,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get single payment
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        subscription: {
          select: {
            id: true,
            tier: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Create payment intent (for frontend payment processing)
router.post(
  '/intent',
  [
    body('amount').isFloat({ min: 0.01 }),
    body('currency').isIn(['USD', 'EUR', 'GBP']),
    body('description').optional().isLength({ max: 500 }),
    body('subscriptionId').isUUID(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { amount, currency, description, subscriptionId } = req.body;

      // Verify subscription ownership
      const subscription = await prisma.subscription.findFirst({
        where: {
          id: subscriptionId,
          userId: req.user!.id,
        },
      });

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId: req.user!.id,
          subscriptionId,
          amount,
          currency,
          description,
          status: 'pending',
        },
      });

      // In a real implementation, you would create a Stripe payment intent here
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: Math.round(amount * 100), // Convert to cents
      //   currency,
      //   metadata: {
      //     paymentId: payment.id,
      //     userId: req.user!.id
      //   }
      // });

      // For demo purposes, we'll return a mock client secret
      const mockClientSecret = `pi_mock_${payment.id}_secret_${Date.now()}`;

      // Update payment with external ID
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          externalId: mockClientSecret.split('_secret_')[0],
          externalStatus: 'requires_payment_method',
        },
      });

      res.json({
        paymentId: payment.id,
        clientSecret: mockClientSecret,
        amount,
        currency,
      });
    } catch (error) {
      console.error('Create payment intent error:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  }
);

// Confirm payment (webhook simulation)
router.post(
  '/:id/confirm',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const payment = await prisma.payment.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      if (payment.status !== 'pending') {
        return res
          .status(400)
          .json({ error: 'Payment is not in pending status' });
      }

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: req.params.id },
        data: {
          status: 'completed',
          externalStatus: 'succeeded',
          paidAt: new Date(),
        },
      });

      // Update subscription if needed (e.g., extend end date)
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'active',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });

      res.json({
        message: 'Payment confirmed successfully',
        payment: updatedPayment,
      });
    } catch (error) {
      console.error('Confirm payment error:', error);
      res.status(500).json({ error: 'Failed to confirm payment' });
    }
  }
);

// Cancel payment
router.post('/:id/cancel', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res
        .status(400)
        .json({ error: 'Only pending payments can be canceled' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        status: 'failed',
        externalStatus: 'canceled',
      },
    });

    res.json({
      message: 'Payment canceled successfully',
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('Cancel payment error:', error);
    res.status(500).json({ error: 'Failed to cancel payment' });
  }
});

// Request refund
router.post(
  '/:id/refund',
  [body('reason').optional().isLength({ max: 500 })],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { reason } = req.body;

      const payment = await prisma.payment.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      if (payment.status !== 'completed') {
        return res
          .status(400)
          .json({ error: 'Only completed payments can be refunded' });
      }

      // In a real implementation, you would process the refund through Stripe
      // const refund = await stripe.refunds.create({
      //   payment_intent: payment.externalId,
      //   reason: 'requested_by_customer'
      // });

      const updatedPayment = await prisma.payment.update({
        where: { id: req.params.id },
        data: {
          status: 'refunded',
          externalStatus: 'refunded',
          metadata: {
            ...(payment.metadata as object),
            refundReason: reason,
            refundedAt: new Date().toISOString(),
          },
        },
      });

      res.json({
        message: 'Refund processed successfully',
        payment: updatedPayment,
      });
    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({ error: 'Failed to process refund' });
    }
  }
);

// Get payment statistics
router.get(
  '/stats/summary',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await prisma.payment.groupBy({
        by: ['status'],
        where: { userId: req.user!.id },
        _count: true,
        _sum: {
          amount: true,
        },
      });

      const totalPayments = await prisma.payment.count({
        where: { userId: req.user!.id },
      });

      const totalPaid = await prisma.payment.aggregate({
        where: {
          userId: req.user!.id,
          status: 'completed',
        },
        _sum: {
          amount: true,
        },
      });

      const lastPayment = await prisma.payment.findFirst({
        where: {
          userId: req.user!.id,
          status: 'completed',
        },
        orderBy: { paidAt: 'desc' },
        select: {
          id: true,
          amount: true,
          currency: true,
          paidAt: true,
          description: true,
        },
      });

      res.json({
        totalPayments,
        totalPaid: totalPaid._sum.amount || 0,
        statusBreakdown: stats.reduce((acc, stat) => {
          acc[stat.status] = {
            count: stat._count,
            total: stat._sum.amount || 0,
          };
          return acc;
        }, {} as Record<string, any>),
        lastPayment,
      });
    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({ error: 'Failed to fetch payment statistics' });
    }
  }
);

export default router;
