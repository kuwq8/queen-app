import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getUserRooms(req: any): Promise<({
        messages: ({
            sender: {
                id: string;
                username: string;
            };
        } & {
            id: string;
            content: string | null;
            mediaUrl: string | null;
            senderId: string;
            roomId: string;
            expiresAt: Date | null;
            createdAt: Date;
        })[];
        participants: ({
            user: {
                id: string;
                username: string;
                profile: {
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            id: string;
            userId: string;
            roomId: string;
            joinedAt: Date;
            lastReadAt: Date | null;
        })[];
    } & {
        id: string;
        name: string | null;
        isGroup: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getRoom(roomId: string, req: any): Promise<({
        participants: ({
            user: {
                id: string;
                username: string;
                profile: {
                    bio: string | null;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            id: string;
            userId: string;
            roomId: string;
            joinedAt: Date;
            lastReadAt: Date | null;
        })[];
    } & {
        id: string;
        name: string | null;
        isGroup: boolean;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    createRoom(req: any, data: {
        usernames: string[];
        isGroup?: boolean;
        name?: string;
    }): Promise<{
        participants: {
            id: string;
            userId: string;
            roomId: string;
            joinedAt: Date;
            lastReadAt: Date | null;
        }[];
    } & {
        id: string;
        name: string | null;
        isGroup: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getMessages(req: any, roomId: string): Promise<({
        sender: {
            id: string;
            username: string;
            profile: {
                avatarUrl: string | null;
            } | null;
        };
    } & {
        id: string;
        content: string | null;
        mediaUrl: string | null;
        senderId: string;
        roomId: string;
        expiresAt: Date | null;
        createdAt: Date;
    })[]>;
    uploadMedia(file: Express.Multer.File): {
        mediaUrl: string;
    };
}
