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
exports.CommunityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CommunityService = class CommunityService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
        setInterval(async () => {
            try {
                const servers = await this.prisma.communityServer.findMany({
                    include: { settings: true, rooms: true }
                });
                for (const server of servers) {
                    const hours = server.settings?.autoDeleteAfterHours || 1;
                    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
                    for (const room of server.rooms) {
                        await this.prisma.communityMessage.deleteMany({
                            where: { roomId: room.id, createdAt: { lt: cutoff } }
                        });
                    }
                }
            }
            catch (e) {
                console.error('Cleanup Error:', e);
            }
        }, 1000 * 60 * 5);
    }
    async createServer(ownerId, name, slug, description, bannerUrl) {
        const existing = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (existing)
            throw new common_1.BadRequestException('Slug already taken');
        const server = await this.prisma.communityServer.create({
            data: {
                name,
                slug,
                description,
                bannerUrl,
                ownerId,
                rooms: {
                    create: [{ name: 'العام' }]
                },
                roles: {
                    create: [{
                            name: 'المدير العام',
                            priority: 10000,
                            canKick: true,
                            canDeleteWall: true,
                            canSendAlerts: true,
                            canChangeOwnNick: true,
                            canChangeOthersNicks: true,
                            canBan: true,
                            canPostAnnouncements: true,
                            canOpenPrivate: true,
                            canMoveUsers: true,
                            canManageRooms: true,
                            canCreateRooms: true,
                            canToggleRooms: true,
                            canManageUsers: true,
                            canMute: true,
                            canEditLikes: true,
                            canManageFilter: true,
                            canManageSubscriptions: true,
                            canAdmin: true,
                            canManageServer: true,
                            canManageRoles: true,
                            canViewAuditLog: true,
                            canSendMessages: true,
                            canEmbedLinks: true,
                            canAttachFiles: true,
                            canManageMessages: true,
                            canMentionEveryone: true,
                            canReadHistory: true
                        }]
                }
            },
            include: { roles: true }
        });
        const adminRole = server.roles[0];
        await this.prisma.communityMember.create({
            data: {
                userId: ownerId,
                serverId: server.id,
                roleId: adminRole.id
            }
        });
        return server;
    }
    async searchServers(q) {
        if (!q) {
            return this.prisma.communityServer.findMany({
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: { _count: { select: { members: true } } }
            });
        }
        return this.prisma.communityServer.findMany({
            where: {
                OR: [
                    { name: { contains: q } },
                    { description: { contains: q } },
                    { slug: { contains: q } }
                ]
            },
            include: { _count: { select: { members: true } } }
        });
    }
    async getUserServers(userId) {
        const members = await this.prisma.communityMember.findMany({
            where: { userId },
            include: {
                server: {
                    include: { _count: { select: { members: true } } }
                }
            }
        });
        return members.map(m => m.server);
    }
    async getCommunity(slug) {
        const server = await this.prisma.communityServer.findUnique({
            where: { slug },
            include: {
                rooms: true,
                roles: true,
                members: { include: { user: true, role: true } },
                settings: true,
                owner: true,
                banners: true,
                gifts: true,
                emojis: true
            }
        });
        if (!server)
            throw new common_1.NotFoundException('Community not found');
        return server;
    }
    async getServerBySlug(slug) {
        const server = await this.prisma.communityServer.findUnique({
            where: { slug },
            include: {
                owner: { select: { username: true } },
                _count: { select: { members: true } },
                rooms: true,
                members: {
                    take: 50,
                    include: {
                        user: { select: { id: true, username: true, profile: { select: { avatarUrl: true, bio: true } } } }
                    }
                }
            }
        });
        if (!server)
            throw new common_1.NotFoundException('Server not found');
        return server;
    }
    async joinServer(userId, slug) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server)
            throw new common_1.NotFoundException('Server not found');
        const existing = await this.prisma.communityMember.findUnique({
            where: { userId_serverId: { userId, serverId: server.id } }
        });
        if (existing)
            return existing;
        const defaultRole = await this.prisma.communityRole.findFirst({ where: { serverId: server.id, isDefault: true } });
        return this.prisma.communityMember.create({
            data: { userId, serverId: server.id, roleId: defaultRole?.id || null }
        });
    }
    async createRoom(userId, slug, name) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server)
            throw new common_1.NotFoundException('Server not found');
        const member = await this.prisma.communityMember.findUnique({
            where: { userId_serverId: { userId, serverId: server.id } },
            include: { role: true }
        });
        if (!member || (member.userId !== server.ownerId && !member.role?.canCreateRooms)) {
            throw new common_1.BadRequestException('Not allowed to create rooms');
        }
        return this.prisma.communityRoom.create({
            data: { name, serverId: server.id }
        });
    }
    async getRoomMessages(userId, roomId) {
        const room = await this.prisma.communityRoom.findUnique({ where: { id: roomId }, include: { server: true } });
        if (!room)
            throw new common_1.NotFoundException('Room not found');
        const member = await this.prisma.communityMember.findUnique({
            where: { userId_serverId: { userId, serverId: room.serverId } }
        });
        if (!member)
            throw new common_1.BadRequestException('You are not a member of this server');
        return this.prisma.communityMessage.findMany({
            where: { roomId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        profile: { select: { avatarUrl: true } },
                        communityMembers: {
                            where: { serverId: room.serverId },
                            select: { nameColor: true, textColor: true, bgColor: true }
                        }
                    }
                }
            }
        });
    }
    async saveMessage(roomId, senderId, content, mediaUrl) {
        const room = await this.prisma.communityRoom.findUnique({
            where: { id: roomId },
            include: {
                server: {
                    include: { settings: true, shortcuts: true }
                }
            }
        });
        if (!room)
            throw new common_1.NotFoundException('Room not found');
        const member = await this.prisma.communityMember.findUnique({
            where: { userId_serverId: { userId: senderId, serverId: room.serverId } },
            include: { role: true }
        });
        if (!member)
            throw new common_1.BadRequestException('Not a member');
        const isOwner = room.server.ownerId === senderId;
        const canSend = room.server.settings?.allowPublicChat || isOwner || member.role?.canAdmin;
        if (!canSend) {
            throw new common_1.BadRequestException('الكتابة في العام مغلقة حالياً من قبل الإدارة.');
        }
        let finalContent = content;
        if (finalContent && room.server.shortcuts && room.server.shortcuts.length > 0) {
            room.server.shortcuts.forEach(s => {
                const regex = new RegExp(`\\b${s.shortcut}\\b`, 'g');
                finalContent = finalContent.replace(regex, s.expansion);
            });
        }
        const newMessage = await this.prisma.communityMessage.create({
            data: { roomId, senderId, content: finalContent, mediaUrl },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        profile: { select: { avatarUrl: true } },
                        communityMembers: {
                            where: { serverId: room.serverId },
                            select: { nameColor: true, textColor: true, bgColor: true }
                        }
                    }
                }
            }
        });
        const limit = room.server.settings?.rollingMessageLimit || 50;
        const oldMessages = await this.prisma.communityMessage.findMany({
            where: { roomId },
            orderBy: { createdAt: 'desc' },
            skip: limit,
            select: { id: true }
        });
        if (oldMessages.length > 0) {
            await this.prisma.communityMessage.deleteMany({
                where: { id: { in: oldMessages.map(m => m.id) } }
            });
        }
        return newMessage;
    }
    async getServerSettings(slug) {
        const server = await this.prisma.communityServer.findUnique({
            where: { slug },
            include: { settings: true }
        });
        if (!server)
            throw new common_1.NotFoundException('Server not found');
        if (!server.settings) {
            return this.prisma.communitySettings.create({
                data: { serverId: server.id }
            });
        }
        return server.settings;
    }
    async updateServerSettings(userId, slug, data) {
        const server = await this.prisma.communityServer.findUnique({
            where: { slug }
        });
        if (!server)
            throw new common_1.NotFoundException('Server not found');
        if (server.ownerId !== userId) {
            throw new common_1.BadRequestException('Only the owner can update settings');
        }
        return this.prisma.communitySettings.upsert({
            where: { serverId: server.id },
            create: {
                serverId: server.id,
                ...data
            },
            update: {
                ...data
            }
        });
    }
    async updateServerBanner(userId, slug, bannerUrl) {
        const server = await this.prisma.communityServer.findUnique({
            where: { slug }
        });
        if (!server)
            throw new common_1.NotFoundException('Server not found');
        if (server.ownerId !== userId)
            throw new common_1.BadRequestException('Only the owner can update the banner');
        return this.prisma.communityServer.update({
            where: { id: server.id },
            data: { bannerUrl }
        });
    }
    async updateMemberColors(userId, slug, colors) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server)
            throw new common_1.NotFoundException('Server not found');
        return this.prisma.communityMember.update({
            where: { userId_serverId: { userId, serverId: server.id } },
            data: colors
        });
    }
    async getMember(userId, slug) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server)
            return null;
        return this.prisma.communityMember.findUnique({
            where: { userId_serverId: { userId, serverId: server.id } },
            include: { role: true }
        });
    }
    async getShortcuts(slug) {
        return this.prisma.communityShortcut.findMany({
            where: { server: { slug } }
        });
    }
    async createShortcut(userId, slug, shortcut, expansion) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server || server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityShortcut.create({ data: { shortcut, expansion, serverId: server.id } });
    }
    async deleteShortcut(userId, id) {
        const s = await this.prisma.communityShortcut.findUnique({ where: { id }, include: { server: true } });
        if (!s || s.server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityShortcut.delete({ where: { id } });
    }
    async getRoles(slug) {
        return this.prisma.communityRole.findMany({
            where: { server: { slug } },
            orderBy: { priority: 'desc' }
        });
    }
    async createRole(userId, slug, data) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server || server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        if (data.isDefault) {
            await this.prisma.communityRole.updateMany({ where: { serverId: server.id }, data: { isDefault: false } });
        }
        return this.prisma.communityRole.create({
            data: {
                ...data,
                serverId: server.id
            }
        });
    }
    async updateRole(userId, id, data) {
        const r = await this.prisma.communityRole.findUnique({ where: { id }, include: { server: true } });
        if (!r || r.server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        if (data.isDefault) {
            await this.prisma.communityRole.updateMany({ where: { serverId: r.serverId }, data: { isDefault: false } });
        }
        const role = await this.prisma.communityRole.findUnique({ where: { id }, include: { server: true } });
        if (!role || role.server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityRole.update({ where: { id }, data });
    }
    async deleteRole(userId, id) {
        const role = await this.prisma.communityRole.findUnique({ where: { id }, include: { server: true } });
        if (!role || role.server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityRole.delete({ where: { id } });
    }
    async getBots(slug) {
        return this.prisma.communityBot.findMany({ where: { server: { slug } } });
    }
    async createBot(userId, slug, data) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server || server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityBot.create({ data: { ...data, serverId: server.id } });
    }
    async updateBot(userId, id, data) {
        const b = await this.prisma.communityBot.findUnique({ where: { id }, include: { server: true } });
        if (!b || b.server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityBot.update({ where: { id }, data });
    }
    async deleteBot(userId, id) {
        const b = await this.prisma.communityBot.findUnique({ where: { id }, include: { server: true } });
        if (!b || b.server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityBot.delete({ where: { id } });
    }
    async getGifts(slug) {
        return this.prisma.communityGift.findMany({ where: { server: { slug } } });
    }
    async createGift(userId, slug, name, imageUrl) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server || server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityGift.create({ data: { name, imageUrl, serverId: server.id } });
    }
    async deleteGift(userId, id) {
        const g = await this.prisma.communityGift.findUnique({ where: { id }, include: { server: true } });
        if (!g || g.server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityGift.delete({ where: { id } });
    }
    async getBanners(slug) {
        return this.prisma.communityBanner.findMany({ where: { server: { slug } } });
    }
    async createBanner(userId, slug, imageUrl) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server || server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityBanner.create({ data: { imageUrl, serverId: server.id } });
    }
    async deleteBanner(userId, id) {
        const b = await this.prisma.communityBanner.findUnique({ where: { id }, include: { server: true } });
        if (!b || b.server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityBanner.delete({ where: { id } });
    }
    async getDomains(slug) {
        return this.prisma.communityDomain.findMany({ where: { server: { slug } } });
    }
    async createDomain(userId, slug, data) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server || server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityDomain.create({ data: { ...data, serverId: server.id } });
    }
    async deleteDomain(userId, id) {
        const d = await this.prisma.communityDomain.findUnique({ where: { id }, include: { server: true } });
        if (!d || d.server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityDomain.delete({ where: { id } });
    }
    async banMember(adminId, slug, targetUserId, durationMinutes) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server)
            throw new common_1.NotFoundException('Server not found');
        await this.prisma.communityMember.update({
            where: { userId_serverId: { userId: targetUserId, serverId: server.id } },
            data: { status: 'BANNED' }
        });
        if (durationMinutes) {
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);
            await this.prisma.communityBan.create({
                data: {
                    userId: targetUserId,
                    serverId: server.id,
                    expiresAt,
                    reason: `Banned for ${durationMinutes} minutes`
                }
            });
        }
        else {
            await this.prisma.communityBan.create({
                data: {
                    userId: targetUserId,
                    serverId: server.id,
                    reason: 'Permanent Ban'
                }
            });
        }
        return { success: true };
    }
    async muteMember(adminId, slug, targetUserId) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server)
            throw new common_1.NotFoundException('Server not found');
        if (server.ownerId !== adminId)
            throw new common_1.BadRequestException('Not allowed');
        return this.prisma.communityMember.update({
            where: { userId_serverId: { userId: targetUserId, serverId: server.id } },
            data: { isMuted: true }
        });
    }
    async getUserFakeUsers(serverId) {
        return this.prisma.communityFakeUser.findMany({ where: { serverId } });
    }
    async muteWallMember(adminId, slug, targetUserId) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server)
            return null;
        return this.prisma.communityMember.update({
            where: { userId_serverId: { userId: targetUserId, serverId: server.id } },
            data: { isWallMuted: true }
        });
    }
    async ignoreMember(userId, slug, targetUserId) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server)
            return null;
        return this.prisma.userIgnore.upsert({
            where: { userId_targetUserId_serverId: { userId, targetUserId, serverId: server.id } },
            update: {},
            create: { userId, targetUserId, serverId: server.id }
        });
    }
    async deleteProfileImage(adminId, targetUserId, type) {
        const data = type === 'avatar' ? { avatarUrl: null } : { coverUrl: null };
        return this.prisma.profile.update({
            where: { userId: targetUserId },
            data
        });
    }
    async clearDecorations(adminId, slug, targetUserId) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server)
            return null;
        return this.prisma.communityMember.update({
            where: { userId_serverId: { userId: targetUserId, serverId: server.id } },
            data: {
                nameColor: null,
                textColor: null,
                bgColor: null,
            }
        });
    }
    async getFakeUsers(slug) {
        return this.prisma.communityFakeUser.findMany({ where: { server: { slug } }, include: { role: true } });
    }
    async createFakeUser(userId, slug, data) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server || server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityFakeUser.create({ data: { ...data, serverId: server.id } });
    }
    async updateFakeUser(userId, id, data) {
        const f = await this.prisma.communityFakeUser.findUnique({ where: { id }, include: { server: true } });
        if (!f || f.server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityFakeUser.update({ where: { id }, data });
    }
    async deleteFakeUser(userId, id) {
        const fake = await this.prisma.communityFakeUser.findUnique({ where: { id }, include: { server: true } });
        if (!fake || fake.server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityFakeUser.delete({ where: { id } });
    }
    async getEmojis(slug) {
        return this.prisma.communityEmoji.findMany({ where: { server: { slug } } });
    }
    async createEmoji(userId, slug, data) {
        const server = await this.prisma.communityServer.findUnique({ where: { slug } });
        if (!server || server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        let shortcut = null;
        if (data.type === 'EMOJI') {
            const emojiCount = await this.prisma.communityEmoji.count({
                where: { serverId: server.id, type: 'EMOJI' }
            });
            shortcut = `ف${emojiCount + 1}`;
        }
        return this.prisma.communityEmoji.create({
            data: { ...data, shortcut, serverId: server.id }
        });
    }
    async deleteEmoji(userId, id) {
        const emoji = await this.prisma.communityEmoji.findUnique({ where: { id }, include: { server: true } });
        if (!emoji || emoji.server.ownerId !== userId)
            throw new common_1.BadRequestException('Unauthorized');
        return this.prisma.communityEmoji.delete({ where: { id } });
    }
    async getLogs(slug) {
        const server = await this.getServerBySlug(slug);
        return this.prisma.communityLog.findMany({ where: { serverId: server.id }, orderBy: { createdAt: 'desc' }, take: 100 });
    }
    async getBans(slug) {
        const server = await this.getServerBySlug(slug);
        return this.prisma.communityBan.findMany({ where: { serverId: server.id }, orderBy: { createdAt: 'desc' } });
    }
    async createBan(slug, data) {
        const server = await this.getServerBySlug(slug);
        return this.prisma.communityBan.create({ data: { ...data, serverId: server.id } });
    }
    async deleteBan(slug, id) {
        return this.prisma.communityBan.delete({ where: { id } });
    }
    async changeMemberPassword(slug, memberId, newPassword) {
        const member = await this.prisma.communityMember.findUnique({ where: { id: memberId }, include: { user: true } });
        if (!member)
            throw new Error('Member not found');
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({ where: { id: member.userId }, data: { password: hashedPassword } });
        return { success: true };
    }
    async deleteMemberAccount(slug, memberId) {
        return this.prisma.communityMember.delete({ where: { id: memberId } });
    }
    async updateMemberPresence(userId, ip, device) {
        await this.prisma.communityMember.updateMany({ where: { userId }, data: { lastSeen: new Date(), lastIp: ip, lastDevice: device } });
    }
    async saveSystemMessage(roomId, senderId, content) {
        return this.prisma.communityMessage.create({ data: { roomId, senderId, content, isSystemMessage: true }, include: { sender: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } } } });
    }
};
exports.CommunityService = CommunityService;
exports.CommunityService = CommunityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommunityService);
//# sourceMappingURL=community.service.js.map