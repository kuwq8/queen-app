import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    searchUsers(q: string, followingOnly: string, req: any): Promise<{
        id: string;
        username: string;
        profile: {
            firstName: string | null;
            lastName: string | null;
            bio: string | null;
            avatarUrl: string | null;
            allowDirectMessages: boolean;
        } | null;
    }[]>;
    updatePrivacy(req: any, allowDirectMessages: boolean): Promise<{
        id: string;
        userId: string;
        firstName: string | null;
        lastName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        coverUrl: string | null;
        allowDirectMessages: boolean;
    }>;
    getBookmarks(req: any): Promise<({
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
            id: string;
            username: string;
            profile: {
                avatarUrl: string | null;
            } | null;
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
    getProfile(username: string, req: any): Promise<{
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
    }>;
    updateProfile(req: any, body: any): Promise<{
        id: string;
        userId: string;
        firstName: string | null;
        lastName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        coverUrl: string | null;
        allowDirectMessages: boolean;
    }>;
    uploadAvatar(req: any, file: Express.Multer.File): Promise<{
        avatarUrl: string;
    }>;
    uploadCover(req: any, file: Express.Multer.File): Promise<{
        coverUrl: string;
    }>;
    toggleFollow(username: string, req: any): Promise<{
        following: boolean;
    }>;
    getUserPosts(username: string, req: any): Promise<({
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
            username: string;
            profile: {
                avatarUrl: string | null;
            } | null;
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
}
