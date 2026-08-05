import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByUsername(username: string): Promise<{
        id: string;
        email: string;
        username: string;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        username: string;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    createUser(data: any): Promise<{
        id: string;
        email: string;
        username: string;
        password: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getUserProfile(username: string, currentUserId: string): Promise<{
        isFollowing: boolean;
        _count: {
            posts: number;
            followers: number;
            following: number;
        };
        id: string;
        email: string;
        username: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    toggleFollow(username: string, currentUserId: string): Promise<{
        following: boolean;
    }>;
    getUserPosts(username: string, currentUserId: string): Promise<({
        likes: {
            id: string;
        }[];
        bookmarks: {
            id: string;
        }[];
        _count: {
            comments: number;
            likes: number;
            quotedBy: number;
        };
        author: {
            profile: {
                avatarUrl: string | null;
            } | null;
            username: string;
        };
    } & {
        id: string;
        content: string;
        authorId: string;
        mediaUrl: string | null;
        quotePostId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getUserBookmarks(userId: string): Promise<({
        likes: {
            id: string;
        }[];
        bookmarks: {
            id: string;
        }[];
        _count: {
            comments: number;
            likes: number;
        };
        author: {
            profile: {
                avatarUrl: string | null;
            } | null;
            id: string;
            username: string;
        };
    } & {
        id: string;
        content: string;
        authorId: string;
        mediaUrl: string | null;
        quotePostId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    updateProfile(userId: string, data: {
        bio?: string;
        firstName?: string;
        lastName?: string;
    }): Promise<{
        id: string;
        userId: string;
        firstName: string | null;
        lastName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        coverUrl: string | null;
        allowDirectMessages: boolean;
    }>;
    updateAvatar(userId: string, avatarUrl: string): Promise<{
        id: string;
        userId: string;
        firstName: string | null;
        lastName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        coverUrl: string | null;
        allowDirectMessages: boolean;
    }>;
    updateCover(userId: string, coverUrl: string): Promise<{
        id: string;
        userId: string;
        firstName: string | null;
        lastName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        coverUrl: string | null;
        allowDirectMessages: boolean;
    }>;
    searchUsers(query: string, currentUserId?: string, followingOnly?: boolean): Promise<{
        profile: {
            firstName: string | null;
            lastName: string | null;
            bio: string | null;
            avatarUrl: string | null;
            allowDirectMessages: boolean;
        } | null;
        id: string;
        username: string;
    }[]>;
    updatePrivacy(userId: string, allowDirectMessages: boolean): Promise<{
        id: string;
        userId: string;
        firstName: string | null;
        lastName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        coverUrl: string | null;
        allowDirectMessages: boolean;
    }>;
}
