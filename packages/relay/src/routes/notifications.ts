/**
 * Push Notifications API Routes
 * 
 * Endpoints:
 * - POST /notifications/subscribe — Subscribe to push notifications
 * - DELETE /notifications/subscribe — Unsubscribe from push notifications
 * - POST /notifications/test — Send test notification
 */

import { Request, Response } from 'express';
import type { Database } from 'better-sqlite3';
import webPush from 'web-push';

export function createNotificationRoutes(db: Database, vapidKeys: { publicKey: string; privateKey: string }): ReturnType<typeof require>['Router'] {
  const router = require('express').Router();

  // Configure VAPID keys
  webPush.setVapidDetails(
    'mailto:admin@agentops.dev',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  // Initialize subscriptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /**
   * POST /notifications/subscribe
   * Subscribe to push notifications
   */
  router.post('/subscribe', (req: Request, res: Response) => {
    try {
      const { endpoint, keys } = req.body as { endpoint: string; keys: { p256dh: string; auth: string } };

      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return res.status(400).json({ error: 'endpoint and keys (p256dh, auth) are required' });
      }

      // Insert or update subscription
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO push_subscriptions (endpoint, p256dh, auth)
        VALUES (?, ?, ?)
      `);

      stmt.run(endpoint, keys.p256dh, keys.auth);

      return res.status(201).json({
        message: 'Subscribed to push notifications',
        vapidPublicKey: vapidKeys.publicKey
      });
    } catch (error: unknown) {
      console.error('Subscribe error:', error);
      return res.status(500).json({ error: 'Failed to subscribe to notifications' });
    }
  });

  /**
   * DELETE /notifications/subscribe
   * Unsubscribe from push notifications
   */
  router.delete('/subscribe', (req: Request, res: Response) => {
    try {
      const { endpoint } = req.body as { endpoint: string };

      if (!endpoint) {
        return res.status(400).json({ error: 'endpoint is required' });
      }

      const stmt = db.prepare(`
        DELETE FROM push_subscriptions WHERE endpoint = ?
      `);

      const result = stmt.run(endpoint);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      return res.json({ message: 'Unsubscribed from push notifications' });
    } catch (error: unknown) {
      console.error('Unsubscribe error:', error);
      return res.status(500).json({ error: 'Failed to unsubscribe from notifications' });
    }
  });

  /**
   * POST /notifications/test
   * Send test notification to all subscribers
   */
  router.post('/test', async (req: Request, res: Response) => {
    try {
      const { title = 'Test Notification', body = 'This is a test notification' } = req.body as { title?: string; body?: string };

      const stmt = db.prepare('SELECT * FROM push_subscriptions');
      const subscriptions = stmt.all() as Array<{ endpoint: string; p256dh: string; auth: string }>;

      const results = await Promise.allSettled(
        subscriptions.map((sub: { endpoint: string; p256dh: string; auth: string }): Promise<webPush.SendResult> =>
          webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            },
            JSON.stringify({
              title,
              body,
              timestamp: new Date().toISOString()
            })
          )
        )
      );

      const success: number = results.filter((r): r is PromiseFulfilledResult<webPush.SendResult> => r.status === 'fulfilled').length;
      const failed: number = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected').length;

      return res.json({
        message: `Test notification sent to ${success} subscribers`,
        success,
        failed
      });
    } catch (error: unknown) {
      console.error('Test notification error:', error);
      return res.status(500).json({ error: 'Failed to send test notification' });
    }
  });

  /**
   * GET /notifications/subscriptions
   * List all push subscriptions
   */
  router.get('/subscriptions', (req: Request, res: Response) => {
    try {
      const stmt = db.prepare('SELECT id, endpoint, created_at FROM push_subscriptions');
      const subscriptions = stmt.all();

      return res.json(subscriptions);
    } catch (error: unknown) {
      console.error('List subscriptions error:', error);
      return res.status(500).json({ error: 'Failed to list subscriptions' });
    }
  });

  return router;
}

/**
 * Send push notification to all subscribers
 */
export async function sendPushNotification(
  db: Database,
  vapidKeys: { publicKey: string; privateKey: string },
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ success: number; failed: number }> {
  webPush.setVapidDetails(
    'mailto:admin@agentops.dev',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  const stmt = db.prepare('SELECT * FROM push_subscriptions');
  const subscriptions = stmt.all() as Array<{ endpoint: string; p256dh: string; auth: string }>;

  const results = await Promise.allSettled(
    subscriptions.map((sub: { endpoint: string; p256dh: string; auth: string }): Promise<webPush.SendResult> =>
      webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        },
        JSON.stringify({
          title,
          body,
          data,
          timestamp: new Date().toISOString()
        })
      )
    )
  );

  const success: number = results.filter((r): r is PromiseFulfilledResult<webPush.SendResult> => r.status === 'fulfilled').length;
  const failed: number = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected').length;

  return { success, failed };
}
