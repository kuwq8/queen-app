import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(req: any): Promise<({
        post: {
            id: string;
            content: string;
        } | null;
        actor: {
            profile: {
                avatarUrl: string | null;
            } | null;
            username: string;
        };
    } & {
        id: string;
        userId: string;
        actorId: string;
        type: string;
        postId: string | null;
        read: boolean;
        createdAt: Date;
    })[]>;
    getUnreadCount(req: any): Promise<{
        count: number;
    }>;
    markAsRead(id: string, req: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
