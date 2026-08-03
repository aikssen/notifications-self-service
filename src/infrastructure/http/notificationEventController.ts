import { Request, Response, Router } from 'express';

import { ListNotificationEvents } from '@/application/use-cases/listNotificationEvents';
import { GetNotificationEventDetail } from '@/application/use-cases/getNotificationEventDetail';
import { NotificationEventState } from '@/domain/value-objects/notificationEventState';
import { isDate, isUuid } from '@/infrastructure/http/requestValidation';

export function notificationEventController(
    listNotificationEvents: ListNotificationEvents,
    getNotificationEventDetail: GetNotificationEventDetail
): Router {

    const router = Router();

    /**
     * GET /notification_events?client_id=uuid
     */
    router.get('/notification_events', async (req: Request, res: Response) => {
        const clientId = req.query.client_id;
        const createdFrom = req.query.created_from;
        const createdTo = req.query.created_to;
        const deliveryStatus = req.query.delivery_status;

        if (!isUuid(clientId)) {
            return res.status(400).json({
                error: 'client_id must be a valid UUID',
            });
        }

        if (createdFrom !== undefined && !isDate(createdFrom)) {
            return res.status(400).json({
                error: 'created_from must be a valid date',
            });
        }

        if (createdTo !== undefined && !isDate(createdTo)) {
            return res.status(400).json({
                error: 'created_to must be a valid date',
            });
        }

        if (
            deliveryStatus !== undefined &&
            !Object.values(NotificationEventState).includes(
                deliveryStatus as NotificationEventState
            )
        ) {
            return res.status(400).json({
                error: 'delivery_status must be PENDING, DELIVERED, FAILED or RETRYING',
            });
        }

        if (
            createdFrom !== undefined &&
            createdTo !== undefined &&
            new Date(createdFrom) > new Date(createdTo)
        ) {
            return res.status(400).json({
                error: 'created_from must be before or equal to created_to',
            });
        }

        const events = await listNotificationEvents.execute(clientId, {
            createdFrom,
            createdTo,
            deliveryStatus: deliveryStatus as NotificationEventState | undefined,
        });
        res.json(events);
    });

    /**
     * GET /notification_events/:notification_event_id
     */
    router.get(
        '/notification_events/:notification_event_id',
        async (req: Request, res: Response) => {

            const rawId = req.params.notification_event_id;
            const clientId = req.query.client_id;

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

            const result =
                await getNotificationEventDetail.execute(rawId, clientId);

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
