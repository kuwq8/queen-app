import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createUser(data: any) {
    return this.prisma.user.create({ data });
  }

  async getUserProfile(username: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: { followers: true, following: true, posts: true },
        },
      },
    });

    if (!user) return null;

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

  async toggleFollow(username: string, currentUserId: string) {
    const targetUser = await this.prisma.user.findUnique({ where: { username } });
    if (!targetUser) throw new Error('User not found');
    if (targetUser.id === currentUserId) throw new Error('Cannot follow yourself');

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
    } else {
      await this.prisma.follows.create({
        data: { followerId: currentUserId, followingId: targetUser.id },
      });
      
      await this.prisma.notification.create({
        data: { type: 'FOLLOW', actorId: currentUserId, userId: targetUser.id }
      });

      return { following: true };
    }
  }

  async getUserPosts(username: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new Error('User not found');

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

  async getUserBookmarks(userId: string) {
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

  async updateProfile(userId: string, data: { bio?: string, firstName?: string, lastName?: string }) {
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

  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.profile.upsert({
      where: { userId },
      update: { avatarUrl },
      create: { userId, avatarUrl }
    });
  }

  async updateCover(userId: string, coverUrl: string) {
    return this.prisma.profile.upsert({
      where: { userId },
      update: { coverUrl },
      create: { userId, coverUrl }
    });
  }

  async searchUsers(query: string, currentUserId?: string, followingOnly?: boolean) {
    let whereClause: any = {};
    
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
    } else if (!query) {
      return []; // Return empty if no query and not filtering by followers
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

  async updatePrivacy(userId: string, allowDirectMessages: boolean) {
    return this.prisma.profile.upsert({
      where: { userId },
      update: { allowDirectMessages },
      create: { userId, allowDirectMessages }
    });
  }
}
