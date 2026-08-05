import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(authorId: string, content: string, mediaUrl?: string, quotePostId?: string) {
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

  async getFeed(currentUserId: string, followingOnly: boolean = false) {
    let whereClause: any = {};
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

  async updatePost(id: string, authorId: string, content: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error('Post not found');
    if (post.authorId !== authorId) throw new Error('Unauthorized to edit this post');

    return this.prisma.post.update({
      where: { id },
      data: { content },
    });
  }

  async deletePost(id: string, authorId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error('Post not found');
    if (post.authorId !== authorId) throw new Error('Unauthorized to delete this post');

    return this.prisma.post.delete({
      where: { id },
    });
  }

  async toggleLike(userId: string, postId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } }
    });
    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      return { liked: false };
    } else {
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

  async toggleBookmark(userId: string, postId: string) {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } }
    });
    if (existing) {
      await this.prisma.bookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    } else {
      await this.prisma.bookmark.create({ data: { userId, postId } });
      return { bookmarked: true };
    }
  }

  async addComment(userId: string, postId: string, content?: string, mediaUrl?: string) {
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

  async getPostComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, profile: { select: { avatarUrl: true } } } }
      }
    });
  }

  async toggleRepost(userId: string, postId: string) {
    // Check if already reposted by this user
    const existing = await this.prisma.post.findFirst({
      where: { authorId: userId, quotePostId: postId, content: '' }
    });

    if (existing) {
      await this.prisma.post.delete({ where: { id: existing.id } });
      return { reposted: false };
    } else {
      await this.prisma.post.create({
        data: { authorId: userId, quotePostId: postId, content: '' }
      });
      const original = await this.prisma.post.findUnique({ where: { id: postId } });
      if (original && original.authorId !== userId) {
        // Could trigger notification here if needed, but not specified in our notification types.
      }
      return { reposted: true };
    }
  }
}
