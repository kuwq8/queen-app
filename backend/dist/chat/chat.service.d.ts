import { PrismaService } from '../prisma/prisma.service';
export declare class ChatService {
    private prisma;
    constructor(prisma: PrismaService);
    getUserRooms(userId: string): Promise<({
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
                profile: {
                    avatarUrl: string | null;
                } | null;
                id: string;
                username: string;
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
    getRoom(roomId: string, userId: string): Promise<({
        participants: ({
            user: {
                profile: {
                    bio: string | null;
                    avatarUrl: string | null;
                } | null;
                id: string;
                username: string;
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
    getRoomMessages(roomId: string, userId: string): Promise<({
        sender: {
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
        senderId: string;
        roomId: string;
        expiresAt: Date | null;
        createdAt: Date;
    })[]>;
    createRoom(creatorId: string, participantUsernames: string[], isGroup?: boolean, name?: string): Promise<{
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
    saveMessage(roomId: string, senderId: string, content?: string, mediaUrl?: string): Promise<{
        sender: {
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
        senderId: string;
        roomId: string;
        expiresAt: Date | null;
        createdAt: Date;
    }>;
    updateLastRead(roomId: string, userId: string): Promise<{
        id: string;
        userId: string;
        roomId: string;
        joinedAt: Date;
        lastReadAt: Date | null;
    }>;
}
