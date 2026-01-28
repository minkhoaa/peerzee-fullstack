import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { UserService } from '../user/user.service';
import { NotFoundException, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { CreateConversationRoomDto } from './dto/create-conversation-room.dto';
import { JoinDto } from './dto/join.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { TypingDto } from './dto/typing.dto';
import { DeleteMessageDto, EditMessageDto } from './dto/edit-message.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { PresenceService } from '../redis/presence.service';

@WebSocketGateway({
  namespace: '/socket/chat',
  cors: { origin: '*', credentials: true },
})
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;
  private onlineUsers: Map<string, Set<string>> = new Map();
  constructor(
    private readonly jwt: JwtService,
    private readonly chatService: ChatService,
    private readonly userService: UserService,
    private readonly presenceService: PresenceService,
  ) { }

  async handleConnection(client: Socket) {
    const userId: string = client.data.user_id;
    await client.join(userId);
    const convIds = await this.chatService.getConversationIdsOfUser(userId);
    for (const id of convIds) {
      await client.join(id);
    }
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)?.add(client.id);
    if (this.onlineUsers.get(userId)?.size === 1) {
      // First socket connection - set online in Redis
      await this.presenceService.setOnline(userId);
      this.server.emit('user:online', {
        userId,
        isOnline: true
      });
    }
    const onlineUserIds = Array.from(this.onlineUsers.keys());
    client.emit('user:online-list', onlineUserIds);
  }

  async handleDisconnect(client: Socket) {
    const userId: string = client.data.user_id;
    if (!userId) return;
    const userSockets = this.onlineUsers.get(userId);
    if (userSockets) {
      userSockets.delete(client.id);
      if (userSockets.size === 0) {
        this.onlineUsers.delete(userId);
        // Last socket disconnected - set offline in Redis & remove from matching pool
        await this.presenceService.setOffline(userId);
        this.server.emit('user:online', {
          userId,
          isOnline: false
        });
      }
    }
  }
  afterInit(server: Server) {
    server.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          (
            socket.handshake.headers?.authorization as string | undefined
          )?.replace('Bearer ', '');

        if (!token) return next(new Error('Missing token'));

        const payload = await this.jwt.verifyAsync(token, {
          secret: process.env.JWT_SECRET,
        });
        socket.data.user_id = payload.sub;
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });
  }
  @SubscribeMessage('conversation:create')
  async createConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateConversationRoomDto,
  ) {
    const userId = client.data.user_id;
    const set = new Set(dto.participantUserIds);
    set.add(userId);

    const conv = await this.chatService.createConversation(dto.type, [...set], dto.name);
    for (const participantId of set) {
      this.server.to(participantId).emit('conversation:new', {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        lastMessageAt: conv.lastMessageAt,
        lastSeq: conv.lastSeq
      });
    }
    await client.join(conv.id);
    return {
      conversationId: conv.id,
      type: conv.type,
      lastMessageAt: conv.lastMessageAt,
      lastSeq: conv.lastSeq,
    };
  }
  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket() socket,
    @MessageBody() dto: JoinDto,
  ) {
    const user_id = socket.data.user_id;
    console.log(`[JOIN] User ${user_id} joining room ${dto.conversation_id}`);
    await socket.join(dto.conversation_id);
    var massages = await this.chatService.getMessages(dto.conversation_id);
    console.log(`[JOIN] Socket rooms:`, Array.from(socket.rooms));
    return massages;
  }
  @SubscribeMessage('conversation:send')
  async sendMessage(
    @ConnectedSocket() socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const user_id = socket.data.user_id;
    console.log(`[SEND] user_id from socket: ${user_id}`);
    console.log(`[SEND] dto:`, dto);

    if (!user_id) {
      return {
        ok: false,
        message: 'User not authenticated - user_id is missing from socket',
      };
    }

    try {
      const msg = await this.chatService.chatMessage(
        dto.conversation_id,
        user_id,
        dto.body,
        dto.fileUrl,
        dto.fileName,
        dto.fileType,
        dto.reply_to_id,
      );
      const roomSockets = await this.server
        .in(dto.conversation_id)
        .fetchSockets();
      console.log(
        `[SEND] Emitting to room ${dto.conversation_id}, sockets in room: ${roomSockets.length}`,
      );
      roomSockets.forEach((s) => console.log(`  - Socket: ${s.id}`));

      this.server.to(dto.conversation_id).emit('message:new', {
        id: msg.id,
        conversation_id: msg.conversation?.id,
        sender_id: msg.sender_id,
        body: msg.body,
        seq: msg.seq,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        fileType: msg.fileType,
        reply_to_id: msg.replyTo?.id,
        replyTo: msg.replyTo ? {
          id: msg.replyTo.id,
          body: msg.replyTo.body,
          sender_id: msg.replyTo.sender_id,
        } : null,
      });

      var massages = await this.chatService.getMessages(dto.conversation_id);

      return massages;
    } catch (error: any) {
      console.error(`[SEND ERROR]`, error.message);
      console.error(`[SEND ERROR] Stack:`, error.stack);
      return { ok: false, message: error.message || 'Failed to send message' };
    }
  }

  @SubscribeMessage('conversation:messages')
  async getMessages(
    @ConnectedSocket() socket,
    @MessageBody()
    dto: { conversation_id: string; limit?: number; before_seq?: string },
  ) {
    const user_id = socket.data.user_id;
    if (!user_id) {
      return { ok: false, message: 'Not authenticated' };
    }

    // Check if user is participant
    const isParticipant = await this.chatService.isParticipants(
      user_id,
      dto.conversation_id,
    );
    if (!isParticipant) {
      return { ok: false, message: 'Not a participant of this conversation' };
    }

    const messages = await this.chatService.getMessages(dto.conversation_id);
    return { ok: true, messages };
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: TypingDto,
  ) {
    const user_id = socket.data.user_id;
    if (!user_id) return;

    // Get display_name
    let display_name = 'Someone';
    try {
      const user = await this.userService.getUserProfile(user_id);
      display_name = user.profile?.display_name || user.email || 'Someone';
    } catch { }

    socket.to(dto.conversation_id).emit('typing:update', {
      conversation_id: dto.conversation_id,
      user_id: user_id,
      display_name: display_name,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: TypingDto,
  ) {
    const user_id = socket.data.user_id;
    if (!user_id) return;

    socket.to(dto.conversation_id).emit('typing:update', {
      conversation_id: dto.conversation_id,
      user_id: user_id,
      display_name: '',
      isTyping: false,
    });
  }
  @SubscribeMessage('message:edit')
  async handleEditMessage(@ConnectedSocket() socket: Socket,
    @MessageBody() dto: EditMessageDto) {
    const user_id = socket.data.user_id;
    if (!user_id) return { ok: false, message: 'Not authenticated' }
    try {
      const message = await this.chatService.editMessage(dto.message_id, user_id, dto.body);
      this.server.to(dto.conversation_id).emit('message:edit', {
        id: message.id,
        body: message.body,
        updatedAt: message.updatedAt,
        isEdited: true,
        conversation_id: dto.conversation_id,
      })
      return { ok: true, message };
    }
    catch (error: any) {
      return { ok: false, message: error.message || 'Failed to edit message' };
    }
  }
  @SubscribeMessage('message:delete')
  async handleDeleteMessage(@ConnectedSocket() socket: Socket,
    @MessageBody() dto: DeleteMessageDto) {
    const user_id = socket.data.user_id;
    if (!user_id) return { ok: false, message: 'Not authenticated' }
    try {
      const message = await this.chatService.deleteMessage(dto.message_id, user_id);
      this.server.to(dto.conversation_id).emit('message:delete', {
        id: message.id,
        conversation_id: dto.conversation_id,
      })
      return { ok: true, message };
    }
    catch (error: any) {
      return { ok: false, message: error.message || 'Failed to delete message' };
    }
  }
  @SubscribeMessage('reaction:add')
  async handleAddReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { message_id: string; emoji: string; conversation_id: string }
  ) {
    const userId = client.data.user_id;
    const reaction = await this.chatService.addReaction(dto.message_id, userId, dto.emoji);

    this.server.to(dto.conversation_id).emit('reaction:added', {
      message_id: dto.message_id,
      user_id: userId,
      emoji: dto.emoji,
      reaction_id: reaction.id
    });
  }

  @SubscribeMessage('reaction:remove')
  async handleRemoveReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { message_id: string; emoji: string; conversation_id: string }
  ) {
    const userId = client.data.user_id;
    await this.chatService.removeReaction(dto.message_id, userId, dto.emoji);

    this.server.to(dto.conversation_id).emit('reaction:removed', {
      message_id: dto.message_id,
      user_id: userId,
      emoji: dto.emoji
    });
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { conversation_id: string; last_read_message_id: string }
  ) {
    const userId = client.data.user_id;

    const result = await this.chatService.markMessageAsRead(dto.last_read_message_id, userId);

    if (result) {
      this.server.to(dto.conversation_id).emit('message:read', {
        message_id: dto.last_read_message_id,
        readAt: result.readAt,
        readBy: userId
      });
    }
  }

  @SubscribeMessage('message:search')
  async handleMessageSearch(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { conversation_id: string; query: string }
  ) {
    const userId = client.data.user_id;
    if (!userId) return { ok: false, message: 'Not authenticated' };

    const isParticipant = await this.chatService.isParticipants(userId, dto.conversation_id);
    if (!isParticipant) return { ok: false, message: 'Not a participant' };

    const results = await this.chatService.searchMessages(dto.conversation_id, dto.query);
    return { ok: true, results };
  }

  @SubscribeMessage('call:offer')
  handleCallOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversation_id: string, offer: RTCSessionDescriptionInit, callType?: 'audio' | 'video' }
  ) {
    const userId = client.data.user_id;
    this.server.to(data.conversation_id).emit('call:offer', {
      user_id: userId,
      conversation_id: data.conversation_id,
      offer: data.offer,
      callType: data.callType || 'audio', // Forward callType so receiver knows it's audio or video call
    });
  }
  @SubscribeMessage('call:answer')
  handleCallAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversation_id: string, answer: RTCSessionDescriptionInit }
  ) {
    const userId = client.data.user_id;
    this.server.to(data.conversation_id).emit('call:answer', {
      user_id: userId,
      answer: data.answer
    });
  }

  @SubscribeMessage('call:ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversation_id: string, candidate: RTCIceCandidateInit }
  ) {
    const userId = client.data.user_id;
    this.server.to(data.conversation_id).emit('call:ice-candidate', {
      user_id: userId,
      candidate: data.candidate
    });
  }
  @SubscribeMessage('call:end')
  handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversation_id: string }
  ) {
    const userId = client.data.user_id;
    this.server.to(data.conversation_id).emit('call:end', {
      user_id: userId,

    });
  }

  // ==================== MATCHING POOL ====================

  @SubscribeMessage('matching:join')
  async handleMatchingJoin(@ConnectedSocket() client: Socket) {
    const userId = client.data.user_id;
    if (!userId) return { ok: false, message: 'Not authenticated' };

    await this.presenceService.joinMatchingPool(userId);
    const poolCount = await this.presenceService.getMatchingPoolCount();

    // Notify user they joined the pool
    client.emit('matching:status', {
      inPool: true,
      poolCount
    });

    return { ok: true, inPool: true, poolCount };
  }

  @SubscribeMessage('matching:leave')
  async handleMatchingLeave(@ConnectedSocket() client: Socket) {
    const userId = client.data.user_id;
    if (!userId) return { ok: false, message: 'Not authenticated' };

    await this.presenceService.leaveMatchingPool(userId);

    client.emit('matching:status', {
      inPool: false,
      poolCount: 0
    });

    return { ok: true, inPool: false };
  }

  @SubscribeMessage('matching:pool-count')
  async handleGetPoolCount(@ConnectedSocket() client: Socket) {
    const count = await this.presenceService.getMatchingPoolCount();
    return { ok: true, poolCount: count };
  }
}
