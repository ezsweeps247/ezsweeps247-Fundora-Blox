import { Router } from 'express';
import { db } from '../db';
import { apiKeys } from '@shared/schema';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';

const router = Router();

// Require admin secret to be set in environment
const ADMIN_SECRET = process.env.ADMIN_SECRET;

// Warn if ADMIN_SECRET is not set (critical security issue)
if (!ADMIN_SECRET) {
  console.warn(
    '\n⚠️  WARNING: ADMIN_SECRET environment variable is not set!\n' +
    '   Admin API endpoints are DISABLED for security.\n' +
    '   Set ADMIN_SECRET in your environment to enable admin functionality.\n'
  );
}

// Middleware to check admin authentication
function requireAdmin(req: any, res: any, next: any) {
  // Block all admin requests if ADMIN_SECRET is not configured
  if (!ADMIN_SECRET) {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Admin API is disabled. ADMIN_SECRET environment variable must be configured.'
    });
  }

  const adminSecret = req.headers['x-admin-secret'] as string;
  
  if (!adminSecret || adminSecret !== ADMIN_SECRET) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid admin credentials'
    });
  }
  
  next();
}

/**
 * POST /api/admin/keys
 * Generate a new API key for external platform integration
 * 
 * Headers:
 *   X-Admin-Secret: <admin secret>
 * 
 * Request Body:
 * {
 *   "name": "My Hosting Platform",
 *   "webhookUrl": "https://yourplatform.com/webhooks/fundora-blox",
 *   "webhookSecret": "your-webhook-secret-123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "apiKey": {
 *     "id": 1,
 *     "name": "My Hosting Platform",
 *     "key": "fblox_live_abc123...",
 *     "webhookUrl": "https://yourplatform.com/webhooks/fundora-blox",
 *     "isActive": true,
 *     "createdAt": "2025-01-15T10:30:00.000Z"
 *   },
 *   "warning": "Store this API key securely - it cannot be retrieved later"
 * }
 */
router.post('/keys', requireAdmin, async (req, res) => {
  try {
    const { name, webhookUrl, webhookSecret } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'name is required'
      });
    }

    // Generate secure API key
    const keyPrefix = 'fblox_live_';
    const randomPart = randomBytes(32).toString('hex');
    const apiKey = `${keyPrefix}${randomPart}`;

    const [newKey] = await db
      .insert(apiKeys)
      .values({
        name,
        key: apiKey,
        webhookUrl: webhookUrl || null,
        webhookSecret: webhookSecret || null,
        isActive: true,
      })
      .returning();

    res.status(201).json({
      success: true,
      apiKey: {
        id: newKey.id,
        name: newKey.name,
        key: newKey.key,
        webhookUrl: newKey.webhookUrl,
        isActive: newKey.isActive,
        createdAt: newKey.createdAt,
      },
      warning: 'Store this API key securely - it cannot be retrieved later'
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create API key'
    });
  }
});

/**
 * GET /api/admin/keys
 * List all API keys (without showing the actual key values)
 */
router.get('/keys', requireAdmin, async (req, res) => {
  try {
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPreview: apiKeys.key, // We'll mask this
        webhookUrl: apiKeys.webhookUrl,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys);

    // Mask API keys to show only the prefix
    const maskedKeys = keys.map(key => ({
      ...key,
      keyPreview: key.keyPreview.substring(0, 15) + '...' + key.keyPreview.substring(key.keyPreview.length - 4)
    }));

    res.json({
      keys: maskedKeys,
      count: maskedKeys.length
    });
  } catch (error) {
    console.error('List API keys error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to list API keys'
    });
  }
});

/**
 * PATCH /api/admin/keys/:id/deactivate
 * Deactivate an API key
 */
router.patch('/keys/:id/deactivate', requireAdmin, async (req, res) => {
  try {
    const keyId = parseInt(req.params.id);

    const [updatedKey] = await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, keyId))
      .returning();

    if (!updatedKey) {
      return res.status(404).json({
        error: 'API key not found',
        message: 'No API key found with this ID'
      });
    }

    res.json({
      success: true,
      message: 'API key deactivated successfully',
      apiKey: {
        id: updatedKey.id,
        name: updatedKey.name,
        isActive: updatedKey.isActive
      }
    });
  } catch (error) {
    console.error('Deactivate API key error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to deactivate API key'
    });
  }
});

/**
 * PATCH /api/admin/keys/:id/activate
 * Reactivate an API key
 */
router.patch('/keys/:id/activate', requireAdmin, async (req, res) => {
  try {
    const keyId = parseInt(req.params.id);

    const [updatedKey] = await db
      .update(apiKeys)
      .set({ isActive: true })
      .where(eq(apiKeys.id, keyId))
      .returning();

    if (!updatedKey) {
      return res.status(404).json({
        error: 'API key not found',
        message: 'No API key found with this ID'
      });
    }

    res.json({
      success: true,
      message: 'API key activated successfully',
      apiKey: {
        id: updatedKey.id,
        name: updatedKey.name,
        isActive: updatedKey.isActive
      }
    });
  } catch (error) {
    console.error('Activate API key error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to activate API key'
    });
  }
});

/**
 * DELETE /api/admin/keys/:id
 * Permanently delete an API key
 */
router.delete('/keys/:id', requireAdmin, async (req, res) => {
  try {
    const keyId = parseInt(req.params.id);

    const [deletedKey] = await db
      .delete(apiKeys)
      .where(eq(apiKeys.id, keyId))
      .returning();

    if (!deletedKey) {
      return res.status(404).json({
        error: 'API key not found',
        message: 'No API key found with this ID'
      });
    }

    res.json({
      success: true,
      message: 'API key deleted successfully',
      apiKey: {
        id: deletedKey.id,
        name: deletedKey.name
      }
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete API key'
    });
  }
});

export default router;
