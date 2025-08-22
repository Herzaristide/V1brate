import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';

const router = Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('username').optional().isLength({ min: 3, max: 30 }),
  body('displayName').optional().isLength({ min: 1, max: 50 }),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

// Helper function to generate tokens
const generateTokens = (userId: string) => {
  const jwtSecret = process.env.JWT_SECRET!;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;

  const accessToken = jwt.sign({ userId }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign({ userId }, jwtRefreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

// Register endpoint
router.post(
  '/register',
  registerValidation,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, username, displayName } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, ...(username ? [{ username }] : [])],
        },
      });

      if (existingUser) {
        return res
          .status(409)
          .json({ error: 'User already exists with this email or username' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          username,
          displayName: displayName || username,
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Create session
      await prisma.session.create({
        data: {
          userId: user.id,
          token: accessToken,
          refreshToken,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        },
      });

      res.status(201).json({
        user,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// Login endpoint
router.post('/login', loginValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email OR username (frontend may send username in the email field)
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: email }],
      },
      select: {
        id: true,
        email: true,
        password: true,
        username: true,
        displayName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      if (process.env.DEBUG_AUTH === 'true') {
        console.debug(
          `Login attempt failed - user not found for identifier: ${email}`
        );
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      if (process.env.DEBUG_AUTH === 'true') {
        console.debug(`Login attempt for inactive user: ${user.id}`);
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password!);
    if (!isValidPassword) {
      if (process.env.DEBUG_AUTH === 'true') {
        console.debug(
          `Login attempt failed - invalid password for user: ${user.id}`
        );
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Update last login and create session
    await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      }),
      prisma.session.create({
        data: {
          userId: user.id,
          token: accessToken,
          refreshToken,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      }),
    ]);

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        activityType: 'login',
        metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
    const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as {
      userId: string;
    };

    // Find session
    const session = await prisma.session.findFirst({
      where: {
        refreshToken,
        userId: decoded.userId,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session || !session.user.isActive) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      session.userId
    );

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: accessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        lastUsed: new Date(),
      },
    });

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout endpoint
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Delete session
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
