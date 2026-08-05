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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PostsService = class PostsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPost(authorId, content, mediaUrl, quotePostId) {
        return this.prisma.post.create({
            data: {
                content,
                authorId,
                mediaUrl,
                quotePostId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        profile: { select: { avatarUrl: true } }
                    }
                },
            },
        });
    }
    async getFeed(currentUserId, followingOnly = false) {
        let whereClause = {};
        if (followingOnly) {
            whereClause = {
                author: {
                    followers: {
                        some: { followerId: currentUserId }
                    }
                }
            };
        }
        return this.prisma.post.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        profile: { select: { avatarUrl: true } }
                    }
                },
                quotePost: {
                    include: {
                        author: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } }
                    }
                },
                _count: { select: { likes: true, comments: true, quotedBy: true } },
                likes: { where: { userId: currentUserId }, select: { id: true } },
                bookmarks: { where: { userId: currentUserId }, select: { id: true } },
            },
            take: 50,
        });
    }
    async updatePost(id, authorId, content) {
        const post = await this.prisma.post.findUnique({ where: { id } });
        if (!post)
            throw new Error('Post not found');
        if (post.authorId !== authorId)
            throw new Error('Unauthorized to edit this post');
        return this.prisma.post.update({
            where: { id },
            data: { content },
        });
    }
    async deletePost(id, authorId) {
        const post = await this.prisma.post.findUnique({ where: { id } });
        if (!post)
            throw new Error('Post not found');
        if (post.authorId !== authorId)
            throw new Error('Unauthorized to delete this post');
        return this.prisma.post.delete({
            where: { id },
        });
    }
    async toggleLike(userId, postId) {
        const existing = await this.prisma.like.findUnique({
            where: { userId_postId: { userId, postId } }
        });
        if (existing) {
            await this.prisma.like.delete({ where: { id: existing.id } });
            return { liked: false };
        }
        else {
            await this.prisma.like.create({ data: { userId, postId } });
            const post = await this.prisma.post.findUnique({ where: { id: postId } });
            if (post && post.authorId !== userId) {
                await this.prisma.notification.create({
                    data: { type: 'LIKE', actorId: userId, userId: post.authorId, postId }
                });
            }
            return { liked: true };
        }
    }
    async toggleBookmark(userId, postId) {
        const existing = await this.prisma.bookmark.findUnique({
            where: { userId_postId: { userId, postId } }
        });
        if (existing) {
            await this.prisma.bookmark.delete({ where: { id: existing.id } });
            return { bookmarked: false };
        }
        else {
            await this.prisma.bookmark.create({ data: { userId, postId } });
            return { bookmarked: true };
        }
    }
    async addComment(userId, postId, content, mediaUrl) {
        const comment = await this.prisma.comment.create({
            data: { authorId: userId, postId, content, mediaUrl },
            include: {
                author: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } }
            }
        });
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (post && post.authorId !== userId) {
            await this.prisma.notification.create({
                data: { type: 'COMMENT', actorId: userId, userId: post.authorId, postId }
            });
        }
        return comment;
    }
    async getPostComments(postId) {
        return this.prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: 'desc' },
            include: {
                author: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } }
            }
        });
    }
    async toggleRepost(userId, postId) {
        const existing = await this.prisma.post.findFirst({
            where: { authorId: userId, quotePostId: postId, content: '' }
        });
        if (existing) {
            await this.prisma.post.delete({ where: { id: existing.id } });
            return { reposted: false };
        }
        else {
            await this.prisma.post.create({
                data: { authorId: userId, quotePostId: postId, content: '' }
            });
            const original = await this.prisma.post.findUnique({ where: { id: postId } });
            if (original && original.authorId !== userId) {
            }
            return { reposted: true };
        }
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PostsService);
//# sourceMappingURL=posts.service.js.map