import { PostsService } from './posts.service';
export declare class PostsController {
    private postsService;
    constructor(postsService: PostsService);
    createPost(req: any, content: string, mediaUrl?: string, quotePostId?: string): Promise<{
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
    uploadMedia(req: any, file: Express.Multer.File): Promise<{
        mediaUrl: string;
    }>;
    getFeed(req: any, followingOnly?: string): Promise<({
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
    updatePost(id: string, req: any, content: string): Promise<{
        id: string;
        content: string;
        authorId: string;
        mediaUrl: string | null;
        quotePostId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deletePost(id: string, req: any): Promise<{
        id: string;
        content: string;
        authorId: string;
        mediaUrl: string | null;
        quotePostId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    toggleLike(id: string, req: any): Promise<{
        liked: boolean;
    }>;
    toggleBookmark(id: string, req: any): Promise<{
        bookmarked: boolean;
    }>;
    addComment(id: string, req: any, content?: string, mediaUrl?: string): Promise<{
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
    getComments(id: string): Promise<({
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
    toggleRepost(id: string, req: any): Promise<{
        reposted: boolean;
    }>;
}
