import { Router } from 'express';
import { ReplayNotificationEvent } from '@/application/use-cases/replayNotificationEvent';
import { isUuid } from '@/infrastructure/http/requestValidation';

export function replayNotificationEventController(
  replayNotificationEvent: ReplayNotificationEvent
) {
  const router = Router();

  router.post(
    '/notification_events/:notification_event_id/replay',
    async (req, res) => {
      const rawId = req.params.notification_event_id;
      const clientId = req.body?.client_id;

      if (!isUuid(rawId)) {
        return res.status(400).json({
          error: 'notification_event_id must be a valid UUID',
        });
      }

      if (!isUuid(clientId)) {
        return res.status(400).json({
          error: 'client_id must be a valid UUID',
        });
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
