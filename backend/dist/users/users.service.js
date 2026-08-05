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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUsername(username) {
        return this.prisma.user.findUnique({ where: { username } });
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async createUser(data) {
        return this.prisma.user.create({ data });
    }
    async getUserProfile(username, currentUserId) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            include: {
                _count: {
                    select: { followers: true, following: true, posts: true },
                },
            },
        });
        if (!user)
            return null;
        const isFollowing = await this.prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: user.id,
                },
            },
        });
        const { password, ...result } = user;
        return { ...result, isFollowing: !!isFollowing };
    }
    async toggleFollow(username, currentUserId) {
        const targetUser = await this.prisma.user.findUnique({ where: { username } });
        if (!targetUser)
            throw new Error('User not found');
        if (targetUser.id === currentUserId)
            throw new Error('Cannot follow yourself');
        const existingFollow = await this.prisma.follows.findUnique({
            where: {
                followerId_followingId: { followerId: currentUserId, followingId: targetUser.id },
            },
        });
        if (existingFollow) {
            await this.prisma.follows.delete({
                where: { followerId_followingId: { followerId: currentUserId, followingId: targetUser.id } },
            });
            return { following: false };
        }
        else {
            await this.prisma.follows.create({
                data: { followerId: currentUserId, followingId: targetUser.id },
            });
            await this.prisma.notification.create({
                data: { type: 'FOLLOW', actorId: currentUserId, userId: targetUser.id }
            });
            return { following: true };
        }
    }
    async getUserPosts(username, currentUserId) {
        const user = await this.prisma.user.findUnique({ where: { username } });
        if (!user)
            throw new Error('User not found');
        return this.prisma.post.findMany({
            where: { authorId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        username: true,
                        profile: { select: { avatarUrl: true } }
                    }
                },
                _count: { select: { comments: true, likes: true, quotedBy: true } },
                likes: { where: { userId: currentUserId }, select: { id: true } },
                bookmarks: { where: { userId: currentUserId }, select: { id: true } },
            },
        });
    }
    async getUserBookmarks(userId) {
        const bookmarks = await this.prisma.bookmark.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                post: {
                    include: {
                        author: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } },
                        _count: { select: { comments: true, likes: true } },
                        likes: { where: { userId }, select: { id: true } },
                        bookmarks: { where: { userId }, select: { id: true } }
                    }
                }
            }
        });
        return bookmarks.map(b => b.post);
    }
    async updateProfile(userId, data) {
        return this.prisma.profile.upsert({
            where: { userId },
            update: {
                bio: data.bio,
                firstName: data.firstName,
                lastName: data.lastName,
            },
            create: {
                userId,
                bio: data.bio,
                firstName: data.firstName,
                lastName: data.lastName,
            }
        });
    }
    async updateAvatar(userId, avatarUrl) {
        return this.prisma.profile.upsert({
            where: { userId },
            update: { avatarUrl },
            create: { userId, avatarUrl }
        });
    }
    async updateCover(userId, coverUrl) {
        return this.prisma.profile.upsert({
            where: { userId },
            update: { coverUrl },
            create: { userId, coverUrl }
        });
    }
    async searchUsers(query, currentUserId, followingOnly) {
        let whereClause = {};
        if (query) {
            whereClause.OR = [
                { username: { contains: query } },
                { profile: { firstName: { contains: query } } },
                { profile: { lastName: { contains: query } } }
            ];
        }
        if (followingOnly && currentUserId) {
            whereClause.followers = {
                some: { followerId: currentUserId }
            };
        }
        else if (!query) {
            return [];
        }
        return this.prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                username: true,
                profile: {
                    select: {
                        avatarUrl: true,
                        bio: true,
                        firstName: true,
                        lastName: true,
                        allowDirectMessages: true
                    }
                }
            },
            take: 20
        });
    }
    async updatePrivacy(userId, allowDirectMessages) {
        return this.prisma.profile.upsert({
            where: { userId },
            update: { allowDirectMessages },
            create: { userId, allowDirectMessages }
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map