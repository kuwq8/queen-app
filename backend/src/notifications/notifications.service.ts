import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        actor: {
          select: { username: true, profile: { select: { avatarUrl: true } } }
        },
        post: {
          select: { id: true, content: true }
        }
      }
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false }
    });
    return { count };
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true }
    });
  }

  async createNotification(userId: string, actorId: string, type: 'LIKE' | 'COMMENT' | 'FOLLOW', postId?: string) {
    if (userId === actorId) return; // Don't notify self

    if (type === 'LIKE' || type === 'FOLLOW') {
      const existing = await this.prisma.notification.findFirst({
        where: { userId, actorId, type, postId }
      });
      if (existing) return;
    }

    return this.prisma.notification.create({
      data: { userId, actorId, type, postId }
    });
  }
}
