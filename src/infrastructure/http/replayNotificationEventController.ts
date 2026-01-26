import { Router } from 'express';
import { ReplayNotificationEvent } from '@/application/use-cases/replayNotificationEvent';

export function replayNotificationEventController(
  replayNotificationEvent: ReplayNotificationEvent
) {
  const router = Router();

  router.post(
    '/notification_events/:notification_event_id/replay',
    async (req, res) => {
      const rawId = req.params.notification_event_id;
      const clientId = req.body.client_id;

      if (!rawId || Array.isArray(rawId)) {
        return res.status(400).json({ error: 'Invalid notification_event_id' });
      }

      if (!clientId) {
        return res.status(400).json({ error: 'client_id is required' });
      }

      try {
        const result = await replayNotificationEvent.execute({
          notificationEventId: rawId,
          clientId,
        });

        res.json(result);
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    }
  );

  return router;
}