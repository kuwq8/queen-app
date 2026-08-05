import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {
    // Cleanup old messages every 5 minutes
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
      } catch(e) { console.error('Cleanup Error:', e); }
    }, 1000 * 60 * 5);
  }

  async checkSlugAvailability(slug: string) {
    const existing = await this.prisma.communityServer.findUnique({ where: { slug } });
    return { available: !existing };
  }

  async createServer(ownerId: string, name: string, slug: string, description?: string, bannerUrl?: string) {
    const existing = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('Slug already taken');

    const server = await this.prisma.communityServer.create({
      data: {
        name,
        slug,
        description,
        bannerUrl,
        ownerId,
        rooms: {
          create: [{ name: 'العام' }] // Default room
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

  async searchServers(q?: string) {
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

  async getUserServers(userId: string) {
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

  async getCommunity(slug: string) {
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
    if (!server) throw new NotFoundException('Community not found');
    return server;
  }

  async getServerBySlug(slug: string) {
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
    if (!server) throw new NotFoundException('Server not found');
    return server;
  }

  async joinServer(userId: string, slug: string) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server) throw new NotFoundException('Server not found');

    const existing = await this.prisma.communityMember.findUnique({
      where: { userId_serverId: { userId, serverId: server.id } }
    });
    if (existing) return existing;

    const defaultRole = await this.prisma.communityRole.findFirst({ where: { serverId: server.id, isDefault: true } });

    return this.prisma.communityMember.create({
      data: { userId, serverId: server.id, roleId: defaultRole?.id || null }
    });
  }

  async createRoom(userId: string, slug: string, name: string) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server) throw new NotFoundException('Server not found');

    const member = await this.prisma.communityMember.findUnique({
      where: { userId_serverId: { userId, serverId: server.id } },
      include: { role: true }
    });
    if (!member || (member.userId !== server.ownerId && !member.role?.canCreateRooms)) {
      throw new BadRequestException('Not allowed to create rooms');
    }

    return this.prisma.communityRoom.create({
      data: { name, serverId: server.id }
    });
  }

  async getRoomMessages(userId: string, roomId: string) {
    const room = await this.prisma.communityRoom.findUnique({ where: { id: roomId }, include: { server: true } });
    if (!room) throw new NotFoundException('Room not found');

    const member = await this.prisma.communityMember.findUnique({
      where: { userId_serverId: { userId, serverId: room.serverId } }
    });
    if (!member) throw new BadRequestException('You are not a member of this server');

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

  async saveMessage(roomId: string, senderId: string, content?: string, mediaUrl?: string) {
    const room = await this.prisma.communityRoom.findUnique({ 
      where: { id: roomId }, 
      include: { 
        server: {
          include: { settings: true, shortcuts: true }
        } 
      } 
    });
    if (!room) throw new NotFoundException('Room not found');

    const member = await this.prisma.communityMember.findUnique({
      where: { userId_serverId: { userId: senderId, serverId: room.serverId } },
      include: { role: true }
    });
    if (!member) throw new BadRequestException('Not a member');

    const isOwner = room.server.ownerId === senderId;
    const canSend = room.server.settings?.allowPublicChat || isOwner || member.role?.canAdmin;
    if (!canSend) {
      throw new BadRequestException('الكتابة في العام مغلقة حالياً من قبل الإدارة.');
    }

    let finalContent = content;
    if (finalContent && room.server.shortcuts && room.server.shortcuts.length > 0) {
      room.server.shortcuts.forEach(s => {
        // Replace exact words
        const regex = new RegExp(`\\b${s.shortcut}\\b`, 'g');
        finalContent = finalContent!.replace(regex, s.expansion);
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

    // Enforce rolling limit (default 50)
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

  async getServerSettings(slug: string) {
    const server = await this.prisma.communityServer.findUnique({
      where: { slug },
      include: { settings: true }
    });
    if (!server) throw new NotFoundException('Server not found');

    if (!server.settings) {
      return this.prisma.communitySettings.create({
        data: { serverId: server.id }
      });
    }

    return server.settings;
  }

  async updateServerSettings(userId: string, slug: string, data: any) {
    const server = await this.prisma.communityServer.findUnique({
      where: { slug }
    });
    if (!server) throw new NotFoundException('Server not found');
    
    // Check if user is owner or admin (simplified to owner for now)
    if (server.ownerId !== userId) {
      throw new BadRequestException('Only the owner can update settings');
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

  async updateServerBanner(userId: string, slug: string, bannerUrl: string) {
    const server = await this.prisma.communityServer.findUnique({
      where: { slug }
    });
    if (!server) throw new NotFoundException('Server not found');
    if (server.ownerId !== userId) throw new BadRequestException('Only the owner can update the banner');
    
    return this.prisma.communityServer.update({
      where: { id: server.id },
      data: { bannerUrl }
    });
  }

  async updateMemberColors(userId: string, slug: string, colors: { nameColor?: string, textColor?: string, bgColor?: string }) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server) throw new NotFoundException('Server not found');

    return this.prisma.communityMember.update({
      where: { userId_serverId: { userId, serverId: server.id } },
      data: colors
    });
  }

  async getMember(userId: string, slug: string) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server) return null;
    return this.prisma.communityMember.findUnique({
      where: { userId_serverId: { userId, serverId: server.id } },
      include: { role: true }
    });
  }

  // --- Shortcuts ---
  async getShortcuts(slug: string) {
    return this.prisma.communityShortcut.findMany({
      where: { server: { slug } }
    });
  }
  async createShortcut(userId: string, slug: string, shortcut: string, expansion: string) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server || server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityShortcut.create({ data: { shortcut, expansion, serverId: server.id } });
  }
  async deleteShortcut(userId: string, id: string) {
    const s = await this.prisma.communityShortcut.findUnique({ where: { id }, include: { server: true } });
    if (!s || s.server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityShortcut.delete({ where: { id } });
  }
  // --- Roles ---
  async getRoles(slug: string) {
    return this.prisma.communityRole.findMany({ 
      where: { server: { slug } },
      orderBy: { priority: 'desc' }
    });
  }

  async createRole(userId: string, slug: string, data: any) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server || server.ownerId !== userId) throw new BadRequestException('Unauthorized');
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

  async updateRole(userId: string, id: string, data: any) {
    const r = await this.prisma.communityRole.findUnique({ where: { id }, include: { server: true } });
    if (!r || r.server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    if (data.isDefault) {
      await this.prisma.communityRole.updateMany({ where: { serverId: r.serverId }, data: { isDefault: false } });
    }
    const role = await this.prisma.communityRole.findUnique({ where: { id }, include: { server: true } });
    if (!role || role.server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityRole.update({ where: { id }, data });
  }

  async deleteRole(userId: string, id: string) {
    const role = await this.prisma.communityRole.findUnique({ where: { id }, include: { server: true } });
    if (!role || role.server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityRole.delete({ where: { id } });
  }

  // --- Bots ---
  async getBots(slug: string) {
    return this.prisma.communityBot.findMany({ where: { server: { slug } } });
  }
  async createBot(userId: string, slug: string, data: any) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server || server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityBot.create({ data: { ...data, serverId: server.id } });
  }
  async updateBot(userId: string, id: string, data: any) {
    const b = await this.prisma.communityBot.findUnique({ where: { id }, include: { server: true } });
    if (!b || b.server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityBot.update({ where: { id }, data });
  }
  async deleteBot(userId: string, id: string) {
    const b = await this.prisma.communityBot.findUnique({ where: { id }, include: { server: true } });
    if (!b || b.server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityBot.delete({ where: { id } });
  }

  // --- Gifts ---
  async getGifts(slug: string) {
    return this.prisma.communityGift.findMany({ where: { server: { slug } } });
  }
  async createGift(userId: string, slug: string, name: string, imageUrl: string) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server || server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityGift.create({ data: { name, imageUrl, serverId: server.id } });
  }
  async deleteGift(userId: string, id: string) {
    const g = await this.prisma.communityGift.findUnique({ where: { id }, include: { server: true } });
    if (!g || g.server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityGift.delete({ where: { id } });
  }

  // --- Banners ---
  async getBanners(slug: string) {
    return this.prisma.communityBanner.findMany({ where: { server: { slug } } });
  }
  async createBanner(userId: string, slug: string, imageUrl: string) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server || server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityBanner.create({ data: { imageUrl, serverId: server.id } });
  }
  async deleteBanner(userId: string, id: string) {
    const b = await this.prisma.communityBanner.findUnique({ where: { id }, include: { server: true } });
    if (!b || b.server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityBanner.delete({ where: { id } });
  }

  // --- Domains ---
  async getDomains(slug: string) {
    return this.prisma.communityDomain.findMany({ where: { server: { slug } } });
  }
  async createDomain(userId: string, slug: string, data: any) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server || server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityDomain.create({ data: { ...data, serverId: server.id } });
  }
  async deleteDomain(userId: string, id: string) {
    const d = await this.prisma.communityDomain.findUnique({ where: { id }, include: { server: true } });
    if (!d || d.server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityDomain.delete({ where: { id } });
  }

  async banMember(adminId: string, slug: string, targetUserId: string, durationMinutes?: number) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server) throw new NotFoundException('Server not found');
    
    // In a real app we'd check adminId has canBan permission, for MVP checking owner
    // if (server.ownerId !== adminId) throw new BadRequestException('Not allowed');

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
    } else {
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

  async muteMember(adminId: string, slug: string, targetUserId: string) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server) throw new NotFoundException('Server not found');
    
    if (server.ownerId !== adminId) throw new BadRequestException('Not allowed');

    return this.prisma.communityMember.update({
      where: { userId_serverId: { userId: targetUserId, serverId: server.id } },
      data: { isMuted: true }
    });
  }

  // --- Fake Users ---
  async getUserFakeUsers(serverId: string) {
    return this.prisma.communityFakeUser.findMany({ where: { serverId } });
  }

  async muteWallMember(adminId: string, slug: string, targetUserId: string) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server) return null;
    return this.prisma.communityMember.update({
      where: { userId_serverId: { userId: targetUserId, serverId: server.id } },
      data: { isWallMuted: true }
    });
  }

  async ignoreMember(userId: string, slug: string, targetUserId: string) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server) return null;
    return this.prisma.userIgnore.upsert({
      where: { userId_targetUserId_serverId: { userId, targetUserId, serverId: server.id } },
      update: {},
      create: { userId, targetUserId, serverId: server.id }
    });
  }

  async deleteProfileImage(adminId: string, targetUserId: string, type: 'avatar' | 'cover') {
     const data = type === 'avatar' ? { avatarUrl: null } : { coverUrl: null };
     return this.prisma.profile.update({
       where: { userId: targetUserId },
       data
     });
  }

  async clearDecorations(adminId: string, slug: string, targetUserId: string) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server) return null;
    return this.prisma.communityMember.update({
      where: { userId_serverId: { userId: targetUserId, serverId: server.id } },
      data: {
        nameColor: null,
        textColor: null,
        bgColor: null,
      }
    });
  }

  async getFakeUsers(slug: string) {
    return this.prisma.communityFakeUser.findMany({ where: { server: { slug } }, include: { role: true } });
  }
  async createFakeUser(userId: string, slug: string, data: any) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server || server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityFakeUser.create({ data: { ...data, serverId: server.id } });
  }
  async updateFakeUser(userId: string, id: string, data: any) {
    const f = await this.prisma.communityFakeUser.findUnique({ where: { id }, include: { server: true } });
    if (!f || f.server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityFakeUser.update({ where: { id }, data });
  }
  async deleteFakeUser(userId: string, id: string) {
    const fake = await this.prisma.communityFakeUser.findUnique({ where: { id }, include: { server: true } });
    if (!fake || fake.server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityFakeUser.delete({ where: { id } });
  }

  // --- Emojis ---
  async getEmojis(slug: string) {
    return this.prisma.communityEmoji.findMany({ where: { server: { slug } } });
  }

  async createEmoji(userId: string, slug: string, data: { type: string; url: string }) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server || server.ownerId !== userId) throw new BadRequestException('Unauthorized');

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

  async deleteEmoji(userId: string, id: string) {
    const emoji = await this.prisma.communityEmoji.findUnique({ where: { id }, include: { server: true } });
    if (!emoji || emoji.server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityEmoji.delete({ where: { id } });
  }

  async getLogs(slug: string) {
    const server = await this.getServerBySlug(slug);
    return this.prisma.communityLog.findMany({ where: { serverId: server.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async getBans(slug: string) {
    const server = await this.getServerBySlug(slug);
    return this.prisma.communityBan.findMany({ where: { serverId: server.id }, orderBy: { createdAt: 'desc' } });
  }

  async createBan(slug: string, data: {ipAddress?: string, device?: string, reason?: string}) {
    const server = await this.getServerBySlug(slug);
    return this.prisma.communityBan.create({ data: { ...data, serverId: server.id } });
  }

  async deleteBan(slug: string, id: string) {
    return this.prisma.communityBan.delete({ where: { id } });
  }

  async changeMemberPassword(slug: string, memberId: string, newPassword: string) {
    const member = await this.prisma.communityMember.findUnique({ where: { id: memberId }, include: { user: true } });
    if (!member) throw new Error('Member not found');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: member.userId }, data: { password: hashedPassword } });
    return { success: true };
  }

  async deleteMemberAccount(slug: string, memberId: string) {
    // Here we can either delete the member from community or delete the user entirely.
    // Since the user might be an organic global user, we just remove the member from community.
    return this.prisma.communityMember.delete({ where: { id: memberId } });
  }
  async updateMemberPresence(userId: string, ip: string, device: string) {
    await this.prisma.communityMember.updateMany({ where: { userId }, data: { lastSeen: new Date(), lastIp: ip, lastDevice: device } });
  }
  async saveSystemMessage(roomId: string, senderId: string, content: string) {
    return this.prisma.communityMessage.create({ data: { roomId, senderId, content, isSystemMessage: true }, include: { sender: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } } } });
  }
}
