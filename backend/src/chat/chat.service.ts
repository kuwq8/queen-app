import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getUserRooms(userId: string) {
    const participants = await this.prisma.chatParticipant.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            participants: {
              include: { user: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } } }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: { select: { id: true, username: true } } }
            }
          }
        }
      },
      orderBy: { room: { updatedAt: 'desc' } }
    });

    return participants.map(p => p.room);
  }

  async getRoom(roomId: string, userId: string) {
    const isParticipant = await this.prisma.chatParticipant.findUnique({
      where: { userId_roomId: { userId, roomId } }
    });
    if (!isParticipant) throw new BadRequestException('Not a participant');

    return this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          include: { user: { select: { id: true, username: true, profile: { select: { avatarUrl: true, bio: true } } } } }
        }
      }
    });
  }

  async getRoomMessages(roomId: string, userId: string) {
    // Verify user is in room
    const isParticipant = await this.prisma.chatParticipant.findUnique({
      where: { userId_roomId: { userId, roomId } }
    });
    if (!isParticipant) throw new BadRequestException('Not a participant of this room');

    return this.prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: 50, // pagination could be added later
      include: {
        sender: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } }
      }
    });
  }

  async createRoom(creatorId: string, participantUsernames: string[], isGroup: boolean = false, name?: string) {
    // find users
    const users = await this.prisma.user.findMany({
      where: { username: { in: participantUsernames } },
      include: { profile: true }
    });
    
    // Privacy Check
    for (const u of users) {
      if (u.id !== creatorId && u.profile?.allowDirectMessages === false) {
        throw new BadRequestException(`User @${u.username} has disabled direct messages.`);
      }
    }

    // Ensure unique IDs to prevent Prisma unique constraint errors
    const allUserIds = Array.from(new Set([creatorId, ...users.map(u => u.id)]));
    
    // Check if direct message already exists
    if (!isGroup && allUserIds.length === 2) {
      const existingRooms = await this.prisma.chatRoom.findMany({
        where: {
          isGroup: false,
          participants: {
            every: { userId: { in: allUserIds } }
          }
        },
        include: { participants: true }
      });
      const match = existingRooms.find(r => r.participants.length === 2);
      if (match) return match;
    }

    return this.prisma.chatRoom.create({
      data: {
        isGroup,
        name,
        participants: {
          create: allUserIds.map(id => ({ userId: id }))
        }
      },
      include: {
        participants: { include: { user: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } } } }
      }
    });
  }

  async saveMessage(roomId: string, senderId: string, content?: string, mediaUrl?: string) {
    const isParticipant = await this.prisma.chatParticipant.findUnique({
      where: { userId_roomId: { userId: senderId, roomId } }
    });
    if (!isParticipant) throw new BadRequestException('Not a participant');
    if (!content && !mediaUrl) throw new BadRequestException('Message cannot be empty');

    const msg = await this.prisma.chatMessage.create({
      data: { roomId, senderId, content, mediaUrl },
      include: {
        sender: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } }
      }
    });

    // Update room updatedAt
    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() }
    });

    return msg;
  }

  async updateLastRead(roomId: string, userId: string) {
    return this.prisma.chatParticipant.update({
      where: { userId_roomId: { userId, roomId } },
      data: { lastReadAt: new Date() }
    });
  }
}
