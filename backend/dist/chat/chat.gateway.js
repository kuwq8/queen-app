"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./chat.service");
const community_service_1 = require("../community/community.service");
const jwt_1 = require("@nestjs/jwt");
let ChatGateway = class ChatGateway {
    chatService;
    communityService;
    jwtService;
    server;
    constructor(chatService, communityService, jwtService) {
        this.chatService = chatService;
        this.communityService = communityService;
        this.jwtService = jwtService;
    }
    async handleConnection(client) {
        try {
            const ip = client.handshake.address;
            client.data.ip = ip;
            const token = client.handshake.auth.token?.split(' ')[1];
            if (!token)
                return client.disconnect();
            const payload = this.jwtService.verify(token);
            client.data.user = payload;
            const rooms = await this.chatService.getUserRooms(payload.sub);
            rooms.forEach(r => client.join(r.id));
            const userAgent = client.handshake.headers['user-agent'] || '';
            await this.communityService.updateMemberPresence(payload.sub, ip, userAgent);
        }
        catch (e) {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
    }
    async handleMessage(data, client) {
        const userId = client.data.user.sub;
        try {
            const message = await this.chatService.saveMessage(data.roomId, userId, data.content, data.mediaUrl);
            this.server.to(data.roomId).emit('newMessage', message);
            return { success: true, message };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    handleTyping(data, client) {
        client.to(data.roomId).emit('userTyping', {
            roomId: data.roomId,
            username: client.data.user.username,
            isTyping: data.isTyping
        });
    }
    async handleReadMessage(data, client) {
        const userId = client.data.user.sub;
        try {
            await this.chatService.updateLastRead(data.roomId, userId);
            client.to(data.roomId).emit('messageRead', { roomId: data.roomId, userId });
        }
        catch (e) { }
    }
    async handleJoinCommunityRoom(data, client) {
        client.join(data.roomId);
        if (client.data.user && data.slug) {
            try {
                const fakeUsers = await this.communityService.getFakeUsers(data.slug);
                if (fakeUsers.length > 0) {
                    const randomFake = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
                    const welcomeMsg = {
                        id: `fake-msg-${Date.now()}`,
                        content: `أهلاً بك يا ${client.data.user.username} في الغرفة!`,
                        roomId: data.roomId,
                        isSystemMessage: false,
                        createdAt: new Date().toISOString(),
                        sender: {
                            id: randomFake.id,
                            username: randomFake.name,
                            profile: {
                                avatarUrl: randomFake.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=fake'
                            }
                        }
                    };
                    this.server.to(data.roomId).emit('newCommunityMessage', welcomeMsg);
                }
            }
            catch (e) { }
        }
    }
    async handleLeaveCommunityRoom(data, client) {
        client.leave(data.roomId);
        if (client.data.user) {
            try {
                const message = await this.communityService.saveSystemMessage(data.roomId, client.data.user.sub, "هذا المستخدم غادر الغرفة");
                this.server.to(data.roomId).emit('newCommunityMessage', message);
            }
            catch (e) { }
        }
    }
    async handleCommunityMessage(data, client) {
        const userId = client.data.user.sub;
        try {
            const message = await this.communityService.saveMessage(data.roomId, userId, data.content, data.mediaUrl);
            this.server.to(data.roomId).emit('newCommunityMessage', message);
            return { success: true, message };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    async handleUpdateColors(data, client) {
        const userId = client.data.user.sub;
        try {
            const updated = await this.communityService.updateMemberColors(userId, data.slug, data.colors);
            this.server.emit('memberColorsUpdated', { userId, colors: data.colors });
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    async handleKickMember(data, client) {
        this.server.emit('userKicked', { targetUserId: data.targetUserId, slug: data.slug });
        return { success: true };
    }
    async handleBanMember(data, client) {
        const adminId = client.data.user.sub;
        try {
            await this.communityService.banMember(adminId, data.slug, data.targetUserId, data.durationMinutes);
            this.server.emit('userBanned', { targetUserId: data.targetUserId, slug: data.slug });
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    async handleMuteMember(data, client) {
        const adminId = client.data.user.sub;
        try {
            await this.communityService.muteMember(adminId, data.slug, data.targetUserId);
            this.server.emit('userMuted', { targetUserId: data.targetUserId, slug: data.slug });
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    async handleMuteWallMember(data, client) {
        const adminId = client.data.user.sub;
        try {
            await this.communityService.muteWallMember(adminId, data.slug, data.targetUserId);
            this.server.emit('userWallMuted', { targetUserId: data.targetUserId, slug: data.slug });
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    async handleIgnoreMember(data, client) {
        const userId = client.data.user.sub;
        try {
            await this.communityService.ignoreMember(userId, data.slug, data.targetUserId);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    async handleDeleteProfileImage(data, client) {
        const adminId = client.data.user.sub;
        try {
            await this.communityService.deleteProfileImage(adminId, data.targetUserId, data.type);
            this.server.emit('profileImageDeleted', { targetUserId: data.targetUserId, type: data.type });
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    async handleClearDecorations(data, client) {
        const adminId = client.data.user.sub;
        try {
            await this.communityService.clearDecorations(adminId, data.slug, data.targetUserId);
            this.server.emit('decorationsCleared', { targetUserId: data.targetUserId });
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    async handleSendAlert(data, client) {
        const server = await this.communityService.getServerSettings(data.slug);
        const member = await this.communityService.getMember(client.data.user.sub, data.slug);
        if (server && !server.allowAlerts && !member?.role?.canAdmin) {
            return { success: false, error: 'التنبيهات مغلقة حالياً من قبل الإدارة.' };
        }
        const sender = {
            id: client.data.user.sub,
            username: client.data.user.username,
        };
        this.server.emit('receiveAlert', {
            targetUserId: data.targetUserId,
            sender,
            type: data.type,
            message: data.message
        });
        return { success: true };
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('readMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleReadMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinCommunityRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinCommunityRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveCommunityRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleLeaveCommunityRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendCommunityMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleCommunityMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('updateMemberColors'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleUpdateColors", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('kickMember'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleKickMember", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('banMember'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleBanMember", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('muteMember'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMuteMember", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('muteWallMember'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMuteWallMember", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ignoreMember'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleIgnoreMember", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('deleteProfileImage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleDeleteProfileImage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('clearDecorations'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleClearDecorations", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendAlert'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendAlert", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        community_service_1.CommunityService,
        jwt_1.JwtService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map