import { PrismaService } from '../prisma/prisma.service';
export declare class PostsService {
    private prisma;
    constructor(prisma: PrismaService);
    createPost(authorId: string, content: string, mediaUrl?: string, quotePostId?: string): Promise<{
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
    }>;
    getFeed(currentUserId: string, followingOnly?: boolean): Promise<({
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
            id: string;
            username: string;
        };
        quotePost: ({
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
        }) | null;
    } & {
        id: string;
        content: string;
        authorId: string;
        mediaUrl: string | null;
        quotePostId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    updatePost(id: string, authorId: string, content: string): Promise<{
        id: string;
        content: string;
        authorId: string;
        mediaUrl: string | null;
        quotePostId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deletePost(id: string, authorId: string): Promise<{
        id: string;
        content: string;
        authorId: string;
        mediaUrl: string | null;
        quotePostId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    toggleLike(userId: string, postId: string): Promise<{
        liked: boolean;
    }>;
    toggleBookmark(userId: string, postId: string): Promise<{
        bookmarked: boolean;
    }>;
    addComment(userId: string, postId: string, content?: string, mediaUrl?: string): Promise<{
        author: {
            profile: {
                avatarUrl: string | null;
            } | null;
            id: string;
            username: string;
        };
    } & {
        id: string;
        content: string | null;
        mediaUrl: string | null;
        authorId: string;
        postId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getPostComments(postId: string): Promise<({
        author: {
            profile: {
                avatarUrl: string | null;
            } | null;
            id: string;
            username: string;
        };
    } & {
        id: string;
        content: string | null;
        mediaUrl: string | null;
        authorId: string;
        postId: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    toggleRepost(userId: string, postId: string): Promise<{
        reposted: boolean;
    }>;
}
