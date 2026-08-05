import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    getUserNotifications(userId: string): Promise<({
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
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
    markAsRead(notificationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    createNotification(userId: string, actorId: string, type: 'LIKE' | 'COMMENT' | 'FOLLOW', postId?: string): Promise<{
        id: string;
        userId: string;
        actorId: string;
        type: string;
        postId: string | null;
        read: boolean;
        createdAt: Date;
    } | undefined>;
}
