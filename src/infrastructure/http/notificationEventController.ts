import { Request, Response, Router } from 'express';

import { ListNotificationEvents } from '@/application/use-cases/listNotificationEvents';
import { GetNotificationEventDetail } from '@/application/use-cases/getNotificationEventDetail';

export function notificationEventController(
    listNotificationEvents: ListNotificationEvents,
    getNotificationEventDetail: GetNotificationEventDetail
): Router {

    const router = Router();

    /**
     * GET /notification_events?client_id=uuid
     */
    router.get('/notification_events', async (req: Request, res: Response) => {
        const clientId = req.query.client_id as string;

        if (!clientId) {
            return res.status(400).json({
                error: 'client_id is required',
            });
        }

        const events = await listNotificationEvents.execute(clientId);
        res.json(events);
    });

    /**
     * GET /notification_events/:notification_event_id
     */
    router.get(
        '/notification_events/:notification_event_id',
        async (req: Request, res: Response) => {

            const rawId = req.params.notification_event_id;

            if (!rawId || Array.isArray(rawId)) {
                return res.status(400).json({
                    error: 'Invalid notification_event_id',
                });
            }

            const result =
                await getNotificationEventDetail.execute(rawId);

            if (!result) {
                return res.status(404).json({
                    error: 'Notification event not found',
                });
            }

            res.json(result);
        }
    );

    return router;
}