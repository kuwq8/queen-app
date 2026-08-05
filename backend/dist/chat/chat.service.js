"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatService = class ChatService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserRooms(userId) {
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
    async getRoom(roomId, userId) {
        const isParticipant = await this.prisma.chatParticipant.findUnique({
            where: { userId_roomId: { userId, roomId } }
        });
        if (!isParticipant)
            throw new common_1.BadRequestException('Not a participant');
        return this.prisma.chatRoom.findUnique({
            where: { id: roomId },
            include: {
                participants: {
                    include: { user: { select: { id: true, username: true, profile: { select: { avatarUrl: true, bio: true } } } } }
                }
            }
        });
    }
    async getRoomMessages(roomId, userId) {
        const isParticipant = await this.prisma.chatParticipant.findUnique({
            where: { userId_roomId: { userId, roomId } }
        });
        if (!isParticipant)
            throw new common_1.BadRequestException('Not a participant of this room');
        return this.prisma.chatMessage.findMany({
            where: { roomId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                sender: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } }
            }
        });
    }
    async createRoom(creatorId, participantUsernames, isGroup = false, name) {
        const users = await this.prisma.user.findMany({
            where: { username: { in: participantUsernames } },
            include: { profile: true }
        });
        for (const u of users) {
            if (u.id !== creatorId && u.profile?.allowDirectMessages === false) {
                throw new common_1.BadRequestException(`User @${u.username} has disabled direct messages.`);
            }
        }
        const allUserIds = Array.from(new Set([creatorId, ...users.map(u => u.id)]));
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
            if (match)
                return match;
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
    async saveMessage(roomId, senderId, content, mediaUrl) {
        const isParticipant = await this.prisma.chatParticipant.findUnique({
            where: { userId_roomId: { userId: senderId, roomId } }
        });
        if (!isParticipant)
            throw new common_1.BadRequestException('Not a participant');
        if (!content && !mediaUrl)
            throw new common_1.BadRequestException('Message cannot be empty');
        const msg = await this.prisma.chatMessage.create({
            data: { roomId, senderId, content, mediaUrl },
            include: {
                sender: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } }
            }
        });
        await this.prisma.chatRoom.update({
            where: { id: roomId },
            data: { updatedAt: new Date() }
        });
        return msg;
    }
    async updateLastRead(roomId, userId) {
        return this.prisma.chatParticipant.update({
            where: { userId_roomId: { userId, roomId } },
            data: { lastReadAt: new Date() }
        });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
//# sourceMappingURL=chat.service.js.map