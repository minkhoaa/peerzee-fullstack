import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Participant } from './entities/participants.entity';
import { Message } from './entities/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageReaction } from './entities/message-reaction.entity';
import { IceBreaker } from './entities/ice-breaker.entity';

@Injectable()
export class ChatService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Conversation)
    private readonly convRepo: Repository<Conversation>,
    @InjectRepository(Participant)
    private readonly partRepo: Repository<Participant>,
    @InjectRepository(Message)
    private readonly msgRepo: Repository<Message>,
    @InjectRepository(MessageReaction)
    private readonly reactionRepo: Repository<MessageReaction>,
    @InjectRepository(IceBreaker)
    private readonly iceBreakerRepo: Repository<IceBreaker>,
  ) { }

  async isParticipants(user_id: string, conversation_id: string) {
    const existed = await this.partRepo.findOne({
      where: { user_id: user_id, conversation_id: conversation_id },
    });
    return !!existed;
  }

  async getConversationIdsOfUser(user_id: string) {
    const rows = await this.partRepo.find({
      where: { user_id: user_id },
      select: ['conversation_id', 'user_id'],
    });
    return rows.map((k) => k.conversation_id);
  }

  async createConversation(type: string, participantUserIds?: string[], name?: string) {
    const validUserIds =
      participantUserIds?.filter((id) => id && id.trim()) || [];

    return this.dataSource.transaction(async (manager) => {
      const conver = await manager.getRepository(Conversation).save({
        type: type,
        name: name,
        lastMessageAt: null,
        lastSeq: '0',
      });

      if (validUserIds.length > 0) {
        await Promise.all(
          validUserIds.map((uid) =>
            manager.getRepository(Participant).save({
              conversation_id: conver.id,
              user_id: uid.trim(),
            }),
          ),
        );
      }
      return conver;
    });
  }

  async chatMessage(conversation_id: string, sender_id: string, body: string, fileUrl?: string, fileName?: string, fileType?: string, reply_to_id?: string) {
    return this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(Conversation)
        .createQueryBuilder()
        .update(Conversation)
        .set({
          lastMessageAt: new Date(),
          lastMessage: body,
          lastSeq: () => '"last_seq" + 1',
        })
        .where('id = :id', { id: conversation_id })
        .execute();

      const conv = await manager.getRepository(Conversation).findOne({
        where: { id: conversation_id },
      });
      if (!conv) throw new NotFoundException('Conversation not found');

      const msg = await manager.getRepository(Message).save({
        conversation_id: conversation_id,
        sender_id: sender_id,
        body: body,
        seq: conv.lastSeq,
        fileUrl: fileUrl,
        fileName: fileName,
        fileType: fileType,
        reply_to_id: reply_to_id || null,
      });

      // Load replyTo if exists
      if (reply_to_id) {
        const replyTo = await manager.getRepository(Message).findOne({ where: { id: reply_to_id } });
        msg.replyTo = replyTo;
      }

      return msg;
    });
  }

  async getMessages(conversation_id: string) {
    return this.msgRepo.find({
      where: { conversation_id: conversation_id },
      relations: ['replyTo'],
      order: { seq: 'ASC' },
    });
  }

  async searchMessages(conversation_id: string, query: string) {
    return this.msgRepo
      .createQueryBuilder('message')
      .where('message.conversation_id = :conversation_id', { conversation_id })
      .andWhere('message.isDeleted = false')
      .andWhere('LOWER(message.body) LIKE LOWER(:query)', { query: `%${query}%` })
      .orderBy('message.seq', 'DESC')
      .limit(50)
      .getMany();
  }

  async editMessage(message_id: string, user_id: string, newBody: string) {
    const message = await this.msgRepo.findOne({
      where: { id: message_id },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.sender_id !== user_id) throw new UnauthorizedException('You are not the sender of this message');
    message.body = newBody;
    message.isEdited = true;
    return this.msgRepo.save(message);
  }
  async deleteMessage(message_id: string, user_id: string) {
    const message = await this.msgRepo.findOne({
      where: { id: message_id },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.sender_id !== user_id) throw new UnauthorizedException('You are not the sender of this message');
    message.isDeleted = true;
    message.deletedAt = new Date();
    return this.msgRepo.save(message);
  }
  async addReaction(messageId: string, userId: string, emoji: string) {
    // Check if already reacted with same emoji
    const existing = await this.reactionRepo.findOne({
      where: { message_id: messageId, user_id: userId, emoji }
    });
    if (existing) return existing;

    return this.reactionRepo.save({ message_id: messageId, user_id: userId, emoji });
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    await this.reactionRepo.delete({ message_id: messageId, user_id: userId, emoji });
  }

  async markMessageAsRead(messageId: string, userId: string) {
    const message = await this.msgRepo.findOne({ where: { id: messageId } });
    if (!message || message.sender_id === userId || message.readAt) {
      return null;
    }
    message.readAt = new Date();
    await this.msgRepo.save(message);
    return { readAt: message.readAt };
  }

  /**
   * Get random ice breaker prompts
   */
  async getRandomIceBreakers(count: number = 3): Promise<IceBreaker[]> {
    // Try to get from database first
    const fromDb = await this.iceBreakerRepo
      .createQueryBuilder('ib')
      .where('ib.isActive = :isActive', { isActive: true })
      .orderBy('RANDOM()')
      .limit(count)
      .getMany();

    if (fromDb.length >= count) {
      return fromDb;
    }

    // Fallback to default prompts if database is empty
    const defaultPrompts = [
      { id: '1', prompt: "What's the best trip you've ever been on?", category: 'general', isActive: true, createdAt: new Date() },
      { id: '2', prompt: "If you could have dinner with anyone, who would it be?", category: 'deep', isActive: true, createdAt: new Date() },
      { id: '3', prompt: "What's your go-to karaoke song?", category: 'fun', isActive: true, createdAt: new Date() },
      { id: '4', prompt: "What's the most spontaneous thing you've ever done?", category: 'fun', isActive: true, createdAt: new Date() },
      { id: '5', prompt: "What's something you're really passionate about?", category: 'deep', isActive: true, createdAt: new Date() },
      { id: '6', prompt: "Coffee or tea? And what's your order?", category: 'general', isActive: true, createdAt: new Date() },
      { id: '7', prompt: "What's on your bucket list?", category: 'deep', isActive: true, createdAt: new Date() },
      { id: '8', prompt: "What's the last show you binged?", category: 'general', isActive: true, createdAt: new Date() },
    ] as IceBreaker[];

    // Shuffle and return requested count
    const shuffled = defaultPrompts.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
