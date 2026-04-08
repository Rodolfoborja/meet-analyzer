import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { db } from '../utils/db.js';

const router = Router();

// GET /api/settings
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.userId },
      select: {
        openaiApiKey: true,
        anthropicApiKey: true,
        geminiApiKey: true,
        defaultLlmProvider: true,
        emailNotifications: true,
        timezone: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const maskKey = (key: string | null) => {
      if (!key) return '';
      if (key.length <= 8) return '••••••••';
      return '••••••••' + key.slice(-4);
    };

    res.json({
      openaiApiKey: maskKey(user.openaiApiKey),
      anthropicApiKey: maskKey(user.anthropicApiKey),
      geminiApiKey: maskKey(user.geminiApiKey),
      defaultLlmProvider: user.defaultLlmProvider,
      emailNotifications: user.emailNotifications,
      timezone: user.timezone,
      hasOpenaiKey: !!user.openaiApiKey,
      hasAnthropicKey: !!user.anthropicApiKey,
      hasGeminiKey: !!user.geminiApiKey,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/settings
router.patch('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const {
      openaiApiKey,
      anthropicApiKey,
      geminiApiKey,
      defaultLlmProvider,
      emailNotifications,
      timezone,
    } = req.body;

    const updateData: any = {};

    if (openaiApiKey && !openaiApiKey.startsWith('••••')) {
      updateData.openaiApiKey = openaiApiKey;
    }
    if (anthropicApiKey && !anthropicApiKey.startsWith('••••')) {
      updateData.anthropicApiKey = anthropicApiKey;
    }
    if (geminiApiKey && !geminiApiKey.startsWith('••••')) {
      updateData.geminiApiKey = geminiApiKey;
    }
    if (defaultLlmProvider) updateData.defaultLlmProvider = defaultLlmProvider;
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (timezone) updateData.timezone = timezone;

    const user = await db.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        defaultLlmProvider: true,
        emailNotifications: true,
        timezone: true,
      },
    });

    res.json({ success: true, ...user });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as settingsRoutes };
