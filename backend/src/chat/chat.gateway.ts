import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket, 
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CommunityService } from '../community/community.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private communityService: CommunityService,
    private jwtService: JwtService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const ip = client.handshake.address;
      client.data.ip = ip;
      const token = client.handshake.auth.token?.split(' ')[1];
      if (!token) return client.disconnect();
      const payload = this.jwtService.decode(token);
      if (!payload) return client.disconnect();
      client.data.user = payload;
      
      // Join all rooms the user is part of
      const rooms = await this.chatService.getUserRooms(payload.sub);
      rooms.forEach(r => client.join(r.id));
      
      const userAgent = client.handshake.headers['user-agent'] || '';
      await this.communityService.updateMemberPresence(payload.sub, ip, userAgent);
      
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // optional: cleanup
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { roomId: string, content?: string, mediaUrl?: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = client.data.user.sub;
    try {
      const message = await this.chatService.saveMessage(data.roomId, userId, data.content, data.mediaUrl);
      this.server.to(data.roomId).emit('newMessage', message);
      return { success: true, message };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { roomId: string, isTyping: boolean },
    @ConnectedSocket() client: Socket
  ) {
    client.to(data.roomId).emit('userTyping', { 
      roomId: data.roomId, 
      username: client.data.user.username,
      isTyping: data.isTyping
    });
  }

  @SubscribeMessage('readMessage')
  async handleReadMessage(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = client.data.user.sub;
    try {
      await this.chatService.updateLastRead(data.roomId, userId);
      // Notify others in the room
      client.to(data.roomId).emit('messageRead', { roomId: data.roomId, userId });
    } catch (e) {}
  }

  // --- Community Sockets ---

  @SubscribeMessage('joinCommunityRoom')
  async handleJoinCommunityRoom(
    @MessageBody() data: { roomId: string, slug?: string },
    @ConnectedSocket() client: Socket
  ) {
    client.join(data.roomId);
    
    // Welcome message from Fake User
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
      } catch (e) {}
    }
  }

  @SubscribeMessage('leaveCommunityRoom')
  async handleLeaveCommunityRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    client.leave(data.roomId);
    if (client.data.user) {
      try {
        const message = await this.communityService.saveSystemMessage(data.roomId, client.data.user.sub, "هذا المستخدم غادر الغرفة");
        this.server.to(data.roomId).emit('newCommunityMessage', message);
      } catch(e) {}
    }
  }

  @SubscribeMessage('sendCommunityMessage')
  async handleCommunityMessage(
    @MessageBody() data: { roomId: string, content?: string, mediaUrl?: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = client.data.user.sub;
    try {
      const message = await this.communityService.saveMessage(data.roomId, userId, data.content, data.mediaUrl);
      this.server.to(data.roomId).emit('newCommunityMessage', message);
      return { success: true, message };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('updateMemberColors')
  async handleUpdateColors(
    @MessageBody() data: { slug: string, colors: { nameColor?: string, textColor?: string, bgColor?: string } },
    @ConnectedSocket() client: Socket
  ) {
    const userId = client.data.user.sub;
    try {
      const updated = await this.communityService.updateMemberColors(userId, data.slug, data.colors);
      this.server.emit('memberColorsUpdated', { userId, colors: data.colors });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('kickMember')
  async handleKickMember(
    @MessageBody() data: { slug: string, targetUserId: string },
    @ConnectedSocket() client: Socket
  ) {
    // In a real app we'd verify admin permissions here. For MVP, we trust the client or rely on service layer
    this.server.emit('userKicked', { targetUserId: data.targetUserId, slug: data.slug });
    return { success: true };
  }

  @SubscribeMessage('banMember')
  async handleBanMember(
    @MessageBody() data: { slug: string, targetUserId: string, durationMinutes?: number },
    @ConnectedSocket() client: Socket
  ) {
    const adminId = client.data.user.sub;
    try {
      await this.communityService.banMember(adminId, data.slug, data.targetUserId, data.durationMinutes);
      this.server.emit('userBanned', { targetUserId: data.targetUserId, slug: data.slug });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('muteMember')
  async handleMuteMember(
    @MessageBody() data: { slug: string, targetUserId: string },
    @ConnectedSocket() client: Socket
  ) {
    const adminId = client.data.user.sub;
    try {
      await this.communityService.muteMember(adminId, data.slug, data.targetUserId);
      this.server.emit('userMuted', { targetUserId: data.targetUserId, slug: data.slug });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('muteWallMember')
  async handleMuteWallMember(
    @MessageBody() data: { slug: string, targetUserId: string },
    @ConnectedSocket() client: Socket
  ) {
    const adminId = client.data.user.sub;
    try {
      await this.communityService.muteWallMember(adminId, data.slug, data.targetUserId);
      this.server.emit('userWallMuted', { targetUserId: data.targetUserId, slug: data.slug });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('ignoreMember')
  async handleIgnoreMember(
    @MessageBody() data: { slug: string, targetUserId: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = client.data.user.sub;
    try {
      await this.communityService.ignoreMember(userId, data.slug, data.targetUserId);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('deleteProfileImage')
  async handleDeleteProfileImage(
    @MessageBody() data: { slug: string, targetUserId: string, type: 'avatar' | 'cover' },
    @ConnectedSocket() client: Socket
  ) {
    const adminId = client.data.user.sub;
    try {
      await this.communityService.deleteProfileImage(adminId, data.targetUserId, data.type);
      this.server.emit('profileImageDeleted', { targetUserId: data.targetUserId, type: data.type });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('clearDecorations')
  async handleClearDecorations(
    @MessageBody() data: { slug: string, targetUserId: string },
    @ConnectedSocket() client: Socket
  ) {
    const adminId = client.data.user.sub;
    try {
      await this.communityService.clearDecorations(adminId, data.slug, data.targetUserId);
      this.server.emit('decorationsCleared', { targetUserId: data.targetUserId });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('sendAlert')
  async handleSendAlert(
    @MessageBody() data: { slug: string, targetUserId: string, type: string, message?: string },
    @ConnectedSocket() client: Socket
  ) {
    const server = await this.communityService.getServerSettings(data.slug);
    // Note: using direct prisma access here is better, but since we have settings:
    // Actually getServerSettings returns the settings object
    const member = await this.communityService.getMember(client.data.user.sub, data.slug);
    
    if (server && !server.allowAlerts && !member?.role?.canAdmin) {
      return { success: false, error: 'التنبيهات مغلقة حالياً من قبل الإدارة.' };
    }

    const sender = {
      id: client.data.user.sub,
      username: client.data.user.username,
      // For a real app, fetch the profile to get avatar. For now we pass username.
    };
    
    this.server.emit('receiveAlert', {
      targetUserId: data.targetUserId,
      sender,
      type: data.type,
      message: data.message
    });
    return { success: true };
  }
}
