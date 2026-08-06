import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CommunityService } from '../community/community.service';
import { JwtService } from '@nestjs/jwt';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private chatService;
    private communityService;
    private jwtService;
    server: Server;
    constructor(chatService: ChatService, communityService: CommunityService, jwtService: JwtService);
    handleConnection(client: Socket): Promise<Socket<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any> | undefined>;
    handleDisconnect(client: Socket): void;
    handleMessage(data: {
        roomId: string;
        content?: string;
        mediaUrl?: string;
    }, client: Socket): Promise<{
        success: boolean;
        message: {
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
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    handleTyping(data: {
        roomId: string;
        isTyping: boolean;
    }, client: Socket): void;
    handleReadMessage(data: {
        roomId: string;
    }, client: Socket): Promise<void>;
    handleJoinCommunityRoom(data: {
        roomId: string;
        slug?: string;
    }, client: Socket): Promise<void>;
    handleLeaveCommunityRoom(data: {
        roomId: string;
    }, client: Socket): Promise<void>;
    handleCommunityMessage(data: {
        roomId: string;
        content?: string;
        mediaUrl?: string;
    }, client: Socket): Promise<{
        success: boolean;
        message: {
            sender: {
                profile: {
                    avatarUrl: string | null;
                } | null;
                id: string;
                username: string;
                communityMembers: {
                    nameColor: string | null;
                    textColor: string | null;
                    bgColor: string | null;
                }[];
            };
        } & {
            id: string;
            content: string | null;
            mediaUrl: string | null;
            senderId: string;
            roomId: string;
            isSystemMessage: boolean;
            createdAt: Date;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    handleUpdateColors(data: {
        slug: string;
        colors: {
            nameColor?: string;
            textColor?: string;
            bgColor?: string;
        };
    }, client: Socket): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleKickMember(data: {
        slug: string;
        targetUserId: string;
    }, client: Socket): Promise<{
        success: boolean;
    }>;
    handleBanMember(data: {
        slug: string;
        targetUserId: string;
        durationMinutes?: number;
    }, client: Socket): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleMuteMember(data: {
        slug: string;
        targetUserId: string;
    }, client: Socket): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleMuteWallMember(data: {
        slug: string;
        targetUserId: string;
    }, client: Socket): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleIgnoreMember(data: {
        slug: string;
        targetUserId: string;
    }, client: Socket): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleDeleteProfileImage(data: {
        slug: string;
        targetUserId: string;
        type: 'avatar' | 'cover';
    }, client: Socket): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleClearDecorations(data: {
        slug: string;
        targetUserId: string;
    }, client: Socket): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleSendAlert(data: {
        slug: string;
        targetUserId: string;
        type: string;
        message?: string;
    }, client: Socket): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
}
