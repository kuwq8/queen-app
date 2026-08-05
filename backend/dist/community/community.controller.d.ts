import { CommunityService } from './community.service';
export declare class CommunityController {
    private readonly communityService;
    constructor(communityService: CommunityService);
    createServer(req: any, body: {
        name: string;
        slug: string;
        description?: string;
        bannerUrl?: string;
    }): Promise<{
        roles: {
            id: string;
            name: string;
            priority: number;
            iconUrl: string | null;
            isDefault: boolean;
            isSystem: boolean;
            serverId: string;
            canKick: boolean;
            canKickRoom: boolean;
            canMuteWall: boolean;
            canQuickChat: boolean;
            canLikeWall: boolean;
            canCommentWall: boolean;
            canDeleteWall: boolean;
            canSendAlerts: boolean;
            canChangeOwnNick: boolean;
            canChangeOthersNicks: boolean;
            canBan: boolean;
            canPostAnnouncements: boolean;
            canOpenPrivate: boolean;
            canMoveUsers: boolean;
            canManageRooms: boolean;
            canCreateRooms: boolean;
            canToggleRooms: boolean;
            canManageUsers: boolean;
            canMute: boolean;
            canEditLikes: boolean;
            canManageFilter: boolean;
            canManageSubscriptions: boolean;
            canAdmin: boolean;
            canManageServer: boolean;
            canManageRoles: boolean;
            canViewAuditLog: boolean;
            canSendMessages: boolean;
            canEmbedLinks: boolean;
            canAttachFiles: boolean;
            canManageMessages: boolean;
            canMentionEveryone: boolean;
            canReadHistory: boolean;
            canEnterLockedRooms: boolean;
        }[];
    } & {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        bannerUrl: string | null;
        ownerId: string;
        isPrivate: boolean;
        createdAt: Date;
    }>;
    searchServers(q: string): Promise<({
        _count: {
            members: number;
        };
    } & {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        bannerUrl: string | null;
        ownerId: string;
        isPrivate: boolean;
        createdAt: Date;
    })[]>;
    getMyServers(req: any): Promise<({
        _count: {
            members: number;
        };
    } & {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        bannerUrl: string | null;
        ownerId: string;
        isPrivate: boolean;
        createdAt: Date;
    })[]>;
    getServerBySlug(slug: string): Promise<{
        owner: {
            username: string;
        };
        members: ({
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
            serverId: string;
            roleId: string | null;
            status: string;
            isMuted: boolean;
            muteUntil: Date | null;
            isWallMuted: boolean;
            warningsCount: number;
            nameColor: string | null;
            textColor: string | null;
            bgColor: string | null;
            joinedAt: Date;
            lastSeen: Date;
            lastIp: string | null;
            lastDevice: string | null;
        })[];
        rooms: {
            id: string;
            name: string;
            serverId: string;
            createdAt: Date;
        }[];
        _count: {
            members: number;
        };
    } & {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        bannerUrl: string | null;
        ownerId: string;
        isPrivate: boolean;
        createdAt: Date;
    }>;
    joinServer(req: any, slug: string): Promise<{
        id: string;
        userId: string;
        serverId: string;
        roleId: string | null;
        status: string;
        isMuted: boolean;
        muteUntil: Date | null;
        isWallMuted: boolean;
        warningsCount: number;
        nameColor: string | null;
        textColor: string | null;
        bgColor: string | null;
        joinedAt: Date;
        lastSeen: Date;
        lastIp: string | null;
        lastDevice: string | null;
    }>;
    createRoom(req: any, slug: string, name: string): Promise<{
        id: string;
        name: string;
        serverId: string;
        createdAt: Date;
    }>;
    getRoomMessages(req: any, roomId: string): Promise<({
        sender: {
            id: string;
            username: string;
            profile: {
                avatarUrl: string | null;
            } | null;
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
    })[]>;
    getServerSettings(slug: string): Promise<{
        id: string;
        serverId: string;
        primaryColor: string | null;
        secondaryColor: string | null;
        backgroundColor: string | null;
        isMarqueeEnabled: boolean;
        marqueeText: string | null;
        areAddonsEnabled: boolean;
        allowPublicChat: boolean;
        allowPrivateChat: boolean;
        allowAlerts: boolean;
        welcomeMessage: string | null;
        rollingMessageLimit: number;
        autoDeleteAfterHours: number;
    }>;
    updateServerSettings(req: any, slug: string, settingsData: any): Promise<{
        id: string;
        serverId: string;
        primaryColor: string | null;
        secondaryColor: string | null;
        backgroundColor: string | null;
        isMarqueeEnabled: boolean;
        marqueeText: string | null;
        areAddonsEnabled: boolean;
        allowPublicChat: boolean;
        allowPrivateChat: boolean;
        allowAlerts: boolean;
        welcomeMessage: string | null;
        rollingMessageLimit: number;
        autoDeleteAfterHours: number;
    }>;
    updateServerBanner(req: any, slug: string, bannerUrl: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        bannerUrl: string | null;
        ownerId: string;
        isPrivate: boolean;
        createdAt: Date;
    }>;
    getRoles(slug: string): Promise<{
        id: string;
        name: string;
        priority: number;
        iconUrl: string | null;
        isDefault: boolean;
        isSystem: boolean;
        serverId: string;
        canKick: boolean;
        canKickRoom: boolean;
        canMuteWall: boolean;
        canQuickChat: boolean;
        canLikeWall: boolean;
        canCommentWall: boolean;
        canDeleteWall: boolean;
        canSendAlerts: boolean;
        canChangeOwnNick: boolean;
        canChangeOthersNicks: boolean;
        canBan: boolean;
        canPostAnnouncements: boolean;
        canOpenPrivate: boolean;
        canMoveUsers: boolean;
        canManageRooms: boolean;
        canCreateRooms: boolean;
        canToggleRooms: boolean;
        canManageUsers: boolean;
        canMute: boolean;
        canEditLikes: boolean;
        canManageFilter: boolean;
        canManageSubscriptions: boolean;
        canAdmin: boolean;
        canManageServer: boolean;
        canManageRoles: boolean;
        canViewAuditLog: boolean;
        canSendMessages: boolean;
        canEmbedLinks: boolean;
        canAttachFiles: boolean;
        canManageMessages: boolean;
        canMentionEveryone: boolean;
        canReadHistory: boolean;
        canEnterLockedRooms: boolean;
    }[]>;
    createRole(req: any, slug: string, body: any): Promise<{
        id: string;
        name: string;
        priority: number;
        iconUrl: string | null;
        isDefault: boolean;
        isSystem: boolean;
        serverId: string;
        canKick: boolean;
        canKickRoom: boolean;
        canMuteWall: boolean;
        canQuickChat: boolean;
        canLikeWall: boolean;
        canCommentWall: boolean;
        canDeleteWall: boolean;
        canSendAlerts: boolean;
        canChangeOwnNick: boolean;
        canChangeOthersNicks: boolean;
        canBan: boolean;
        canPostAnnouncements: boolean;
        canOpenPrivate: boolean;
        canMoveUsers: boolean;
        canManageRooms: boolean;
        canCreateRooms: boolean;
        canToggleRooms: boolean;
        canManageUsers: boolean;
        canMute: boolean;
        canEditLikes: boolean;
        canManageFilter: boolean;
        canManageSubscriptions: boolean;
        canAdmin: boolean;
        canManageServer: boolean;
        canManageRoles: boolean;
        canViewAuditLog: boolean;
        canSendMessages: boolean;
        canEmbedLinks: boolean;
        canAttachFiles: boolean;
        canManageMessages: boolean;
        canMentionEveryone: boolean;
        canReadHistory: boolean;
        canEnterLockedRooms: boolean;
    }>;
    updateRole(req: any, id: string, body: any): Promise<{
        id: string;
        name: string;
        priority: number;
        iconUrl: string | null;
        isDefault: boolean;
        isSystem: boolean;
        serverId: string;
        canKick: boolean;
        canKickRoom: boolean;
        canMuteWall: boolean;
        canQuickChat: boolean;
        canLikeWall: boolean;
        canCommentWall: boolean;
        canDeleteWall: boolean;
        canSendAlerts: boolean;
        canChangeOwnNick: boolean;
        canChangeOthersNicks: boolean;
        canBan: boolean;
        canPostAnnouncements: boolean;
        canOpenPrivate: boolean;
        canMoveUsers: boolean;
        canManageRooms: boolean;
        canCreateRooms: boolean;
        canToggleRooms: boolean;
        canManageUsers: boolean;
        canMute: boolean;
        canEditLikes: boolean;
        canManageFilter: boolean;
        canManageSubscriptions: boolean;
        canAdmin: boolean;
        canManageServer: boolean;
        canManageRoles: boolean;
        canViewAuditLog: boolean;
        canSendMessages: boolean;
        canEmbedLinks: boolean;
        canAttachFiles: boolean;
        canManageMessages: boolean;
        canMentionEveryone: boolean;
        canReadHistory: boolean;
        canEnterLockedRooms: boolean;
    }>;
    deleteRole(req: any, id: string): Promise<{
        id: string;
        name: string;
        priority: number;
        iconUrl: string | null;
        isDefault: boolean;
        isSystem: boolean;
        serverId: string;
        canKick: boolean;
        canKickRoom: boolean;
        canMuteWall: boolean;
        canQuickChat: boolean;
        canLikeWall: boolean;
        canCommentWall: boolean;
        canDeleteWall: boolean;
        canSendAlerts: boolean;
        canChangeOwnNick: boolean;
        canChangeOthersNicks: boolean;
        canBan: boolean;
        canPostAnnouncements: boolean;
        canOpenPrivate: boolean;
        canMoveUsers: boolean;
        canManageRooms: boolean;
        canCreateRooms: boolean;
        canToggleRooms: boolean;
        canManageUsers: boolean;
        canMute: boolean;
        canEditLikes: boolean;
        canManageFilter: boolean;
        canManageSubscriptions: boolean;
        canAdmin: boolean;
        canManageServer: boolean;
        canManageRoles: boolean;
        canViewAuditLog: boolean;
        canSendMessages: boolean;
        canEmbedLinks: boolean;
        canAttachFiles: boolean;
        canManageMessages: boolean;
        canMentionEveryone: boolean;
        canReadHistory: boolean;
        canEnterLockedRooms: boolean;
    }>;
    getShortcuts(slug: string): Promise<{
        id: string;
        shortcut: string;
        expansion: string;
        serverId: string;
        createdAt: Date;
    }[]>;
    createShortcut(req: any, slug: string, body: {
        shortcut: string;
        expansion: string;
    }): Promise<{
        id: string;
        shortcut: string;
        expansion: string;
        serverId: string;
        createdAt: Date;
    }>;
    deleteShortcut(req: any, id: string): Promise<{
        id: string;
        shortcut: string;
        expansion: string;
        serverId: string;
        createdAt: Date;
    }>;
    getBots(slug: string): Promise<{
        id: string;
        type: string;
        intervalMinutes: number;
        content: string | null;
        isActive: boolean;
        serverId: string;
        createdAt: Date;
    }[]>;
    createBot(req: any, slug: string, body: any): Promise<{
        id: string;
        type: string;
        intervalMinutes: number;
        content: string | null;
        isActive: boolean;
        serverId: string;
        createdAt: Date;
    }>;
    updateBot(req: any, id: string, body: any): Promise<{
        id: string;
        type: string;
        intervalMinutes: number;
        content: string | null;
        isActive: boolean;
        serverId: string;
        createdAt: Date;
    }>;
    deleteBot(req: any, id: string): Promise<{
        id: string;
        type: string;
        intervalMinutes: number;
        content: string | null;
        isActive: boolean;
        serverId: string;
        createdAt: Date;
    }>;
    getGifts(slug: string): Promise<{
        id: string;
        name: string;
        imageUrl: string;
        serverId: string;
        createdAt: Date;
    }[]>;
    createGift(req: any, slug: string, body: {
        name: string;
        imageUrl: string;
    }): Promise<{
        id: string;
        name: string;
        imageUrl: string;
        serverId: string;
        createdAt: Date;
    }>;
    deleteGift(req: any, id: string): Promise<{
        id: string;
        name: string;
        imageUrl: string;
        serverId: string;
        createdAt: Date;
    }>;
    getBanners(slug: string): Promise<{
        id: string;
        imageUrl: string;
        serverId: string;
        createdAt: Date;
    }[]>;
    createBanner(req: any, slug: string, body: {
        imageUrl: string;
    }): Promise<{
        id: string;
        imageUrl: string;
        serverId: string;
        createdAt: Date;
    }>;
    deleteBanner(req: any, id: string): Promise<{
        id: string;
        imageUrl: string;
        serverId: string;
        createdAt: Date;
    }>;
    getDomains(slug: string): Promise<{
        id: string;
        domain: string;
        seoTitle: string | null;
        seoDescription: string | null;
        seoKeywords: string | null;
        serverId: string;
        createdAt: Date;
    }[]>;
    createDomain(req: any, slug: string, body: any): Promise<{
        id: string;
        domain: string;
        seoTitle: string | null;
        seoDescription: string | null;
        seoKeywords: string | null;
        serverId: string;
        createdAt: Date;
    }>;
    deleteDomain(req: any, id: string): Promise<{
        id: string;
        domain: string;
        seoTitle: string | null;
        seoDescription: string | null;
        seoKeywords: string | null;
        serverId: string;
        createdAt: Date;
    }>;
    getFakeUsers(slug: string): Promise<({
        role: {
            id: string;
            name: string;
            priority: number;
            iconUrl: string | null;
            isDefault: boolean;
            isSystem: boolean;
            serverId: string;
            canKick: boolean;
            canKickRoom: boolean;
            canMuteWall: boolean;
            canQuickChat: boolean;
            canLikeWall: boolean;
            canCommentWall: boolean;
            canDeleteWall: boolean;
            canSendAlerts: boolean;
            canChangeOwnNick: boolean;
            canChangeOthersNicks: boolean;
            canBan: boolean;
            canPostAnnouncements: boolean;
            canOpenPrivate: boolean;
            canMoveUsers: boolean;
            canManageRooms: boolean;
            canCreateRooms: boolean;
            canToggleRooms: boolean;
            canManageUsers: boolean;
            canMute: boolean;
            canEditLikes: boolean;
            canManageFilter: boolean;
            canManageSubscriptions: boolean;
            canAdmin: boolean;
            canManageServer: boolean;
            canManageRoles: boolean;
            canViewAuditLog: boolean;
            canSendMessages: boolean;
            canEmbedLinks: boolean;
            canAttachFiles: boolean;
            canManageMessages: boolean;
            canMentionEveryone: boolean;
            canReadHistory: boolean;
            canEnterLockedRooms: boolean;
        } | null;
    } & {
        id: string;
        name: string;
        avatarUrl: string | null;
        status: string;
        serverId: string;
        roleId: string | null;
        createdAt: Date;
    })[]>;
    createFakeUser(req: any, slug: string, body: any): Promise<{
        id: string;
        name: string;
        avatarUrl: string | null;
        status: string;
        serverId: string;
        roleId: string | null;
        createdAt: Date;
    }>;
    updateFakeUser(req: any, id: string, body: any): Promise<{
        id: string;
        name: string;
        avatarUrl: string | null;
        status: string;
        serverId: string;
        roleId: string | null;
        createdAt: Date;
    }>;
    deleteFakeUser(req: any, id: string): Promise<{
        id: string;
        name: string;
        avatarUrl: string | null;
        status: string;
        serverId: string;
        roleId: string | null;
        createdAt: Date;
    }>;
    getEmojis(slug: string): Promise<{
        id: string;
        type: string;
        url: string;
        shortcut: string | null;
        serverId: string;
        createdAt: Date;
    }[]>;
    createEmoji(req: any, slug: string, body: {
        type: string;
        url: string;
    }): Promise<{
        id: string;
        type: string;
        url: string;
        shortcut: string | null;
        serverId: string;
        createdAt: Date;
    }>;
    deleteEmoji(req: any, id: string): Promise<{
        id: string;
        type: string;
        url: string;
        shortcut: string | null;
        serverId: string;
        createdAt: Date;
    }>;
}
