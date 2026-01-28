import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Conversation } from './entities/conversation.entity';
import { Participant } from './entities/participants.entity';
import { Message } from './entities/message.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { IceBreaker } from './entities/ice-breaker.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly convRepo: EntityRepository<Conversation>,
    @InjectRepository(Participant)
    private readonly partRepo: EntityRepository<Participant>,
    @InjectRepository(Message)
    private readonly msgRepo: EntityRepository<Message>,
    @InjectRepository(MessageReaction)
    private readonly reactionRepo: EntityRepository<MessageReaction>,
    @InjectRepository(IceBreaker)
    private readonly iceBreakerRepo: EntityRepository<IceBreaker>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: EntityRepository<UserProfile>,
    private readonly em: EntityManager,
  ) { }

  async isParticipants(user_id: string, conversation_id: string) {
    const existed = await this.partRepo.findOne({
      user: { id: user_id }, conversation: { id: conversation_id },
    });
    return !!existed;
  }

  async getConversationIdsOfUser(user_id: string) {
    const rows = await this.partRepo.find(
      { user: { id: user_id } },
      { populate: ['conversation'] }
    );
    return rows.map((k) => k.conversation.id);
  }

  /**
   * Find existing DM conversation between two users, or create a new one
   * Returns the conversation with participant info
   */
  async findOrCreateDMConversation(userId: string, targetUserId: string): Promise<Conversation> {
    // Find existing DM using ORM (QueryBuilder)
    // We need a conversation that has both participants and isDirect=true
    const qb = this.em.createQueryBuilder(Conversation, 'c');
    qb.select('c.*')
      .join('c.participants', 'p1')
      .join('c.participants', 'p2')
      .where({ 'c.isDirect': true })
      .andWhere({ 'p1.user.id': userId })
      .andWhere({ 'p2.user.id': targetUserId })
      .limit(1);

    const existingDM = await qb.getSingleResult();

    if (existingDM) {
      return existingDM;
    }

    // Get target user's display_name for conversation name
    const targetProfile = await this.profileRepo.findOne({
      user: { id: targetUserId },
    });
    const conversationName = targetProfile?.display_name || 'Chat';

    // Create new DM conversation
    return this.em.transactional(async (em) => {
      const conversation = new Conversation();
      conversation.type = 'direct';
      conversation.name = conversationName;
      conversation.isDirect = true;
      conversation.lastMessageAt = null;
      conversation.lastSeq = '0';
      em.persist(conversation);

      // Add both participants
      const p1 = new Participant();
      p1.conversation = conversation; // Direct reference
      p1.user = em.getReference(User, userId);
      em.persist(p1);

      const p2 = new Participant();
      p2.conversation = conversation; // Direct reference
      p2.user = em.getReference(User, targetUserId);
      em.persist(p2);

      await em.flush();
      return conversation;
    });
  }

  async createConversation(type: string, participantUserIds?: string[], name?: string) {
    const validUserIds =
      participantUserIds?.filter((id) => id && id.trim()) || [];

    return this.em.transactional(async (em) => {
      const conver = new Conversation();
      conver.type = type;
      conver.name = name || 'Chat';
      conver.lastMessageAt = null;
      conver.lastSeq = '0';
      em.persist(conver);

      if (validUserIds.length > 0) {
        for (const uid of validUserIds) {
          const participant = new Participant();
          participant.conversation = conver;
          participant.user = em.getReference(User, uid.trim());
          em.persist(participant);
        }
      }

      await em.flush();
      return conver;
    });
  }

  async chatMessage(conversation_id: string, sender_id: string, body: string, fileUrl?: string, fileName?: string, fileType?: string, reply_to_id?: string) {
    return this.em.transactional(async (em) => {
      const conv = await em.findOne(Conversation, { id: conversation_id });
      if (!conv) throw new NotFoundException('Conversation not found');

      // Update conversation metadata
      conv.lastMessageAt = new Date();
      conv.lastMessage = body.substring(0, 100); // Truncate preview if needed, or keep full
      // Atomic increment for lastSeq using JS (assuming pessimistic lock or accepting slight race in MVP)
      // Or cleaner: just parse int, add 1, stringify.
      const currentSeq = parseInt(conv.lastSeq || '0', 10);
      conv.lastSeq = (currentSeq + 1).toString();

      em.persist(conv);

      const msg = new Message();
      msg.conversation = conv;
      msg.sender_id = sender_id;
      msg.body = body;
      msg.seq = conv.lastSeq;
      msg.fileUrl = fileUrl || null;
      msg.fileName = fileName || null;
      msg.fileType = fileType || null;

      // Set replyTo if exists
      if (reply_to_id) {
        const replyToMsg = await em.findOne(Message, { id: reply_to_id });
        msg.replyTo = replyToMsg;
      }
      em.persist(msg);

      await em.flush();
      return msg;
    });
  }

  async getMessages(conversation_id: string) {
    return this.msgRepo.find(
      { conversation: { id: conversation_id } },
      {
        populate: ['replyTo'],
        orderBy: { seq: 'ASC' },
      }
    );
  }

  async searchMessages(conversation_id: string, query: string) {
    // Use ORM find with ILIKE
    return this.msgRepo.find({
      conversation: { id: conversation_id },
      isDeleted: false,
      body: { $ilike: `%${query}%` }
    }, {
      orderBy: { seq: 'DESC' },
      limit: 50
    });
  }

  // ... editMessage, deleteMessage, etc (unchanged or already ORM) ...

  async editMessage(message_id: string, user_id: string, newBody: string) {
    const message = await this.msgRepo.findOne({ id: message_id });
    if (!message) throw new NotFoundException('Message not found');
    if (message.sender_id !== user_id) throw new UnauthorizedException('You are not the sender of this message');
    message.body = newBody;
    message.isEdited = true;
    await this.em.persistAndFlush(message);
    return message;
  }

  // ... deleteMessage, addReaction, etc ...

  async deleteMessage(message_id: string, user_id: string) {
    const message = await this.msgRepo.findOne({ id: message_id });
    if (!message) throw new NotFoundException('Message not found');
    if (message.sender_id !== user_id) throw new UnauthorizedException('You are not the sender of this message');
    message.isDeleted = true;
    message.deletedAt = new Date();
    await this.em.persistAndFlush(message);
    return message;
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.msgRepo.findOne({ id: messageId });
    if (!message) throw new Error('Message not found');

    // Check if already reacted with same emoji
    const existing = await this.reactionRepo.findOne({
      message, user_id: userId, emoji
    });
    if (existing) return existing;

    const reaction = new MessageReaction();
    reaction.message = message;
    reaction.user_id = userId;
    reaction.emoji = emoji;
    await this.em.persistAndFlush(reaction);
    return reaction;
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.msgRepo.findOne({ id: messageId });
    if (!message) return;
    await this.reactionRepo.nativeDelete({ message, user_id: userId, emoji });
  }

  async markMessageAsRead(messageId: string, userId: string) {
    const message = await this.msgRepo.findOne({ id: messageId });
    if (!message || message.sender_id === userId || message.readAt) {
      return null;
    }
    message.readAt = new Date();
    await this.em.persistAndFlush(message);
    return { readAt: message.readAt };
  }

  /**
   * Update conversation with AI-generated icebreaker suggestion
   */
  async updateConversationIcebreaker(conversationId: string, icebreaker: string): Promise<void> {
    await this.convRepo.nativeUpdate({ id: conversationId }, { icebreakerSuggestion: icebreaker });
  }

  /**
   * Get random ice breaker prompts
   */
  async getRandomIceBreakers(count: number = 3): Promise<IceBreaker[]> {
    // ORM approach: get all active, shuffle in app (assuming small dataset)
    // If dataset is huge, use qb.orderBy({ [raw]: 'RANDOM()' })
    const all = await this.iceBreakerRepo.find({ isActive: true });

    if (all.length === 0) {
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
      const shuffled = defaultPrompts.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }

    const shuffled = all.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Get conversation context for AI reply suggestions
   * Returns last N messages and partner's profile
   */
  async getConversationContext(conversationId: string, currentUserId: string, messageLimit: number = 10) {
    // Get conversation with participants
    const conversation = await this.convRepo.findOne(
      { id: conversationId },
      { populate: ['participants'] }
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Find partner's user_id
    const partnerParticipant = conversation.participants.find(p => p.user.id !== currentUserId);
    if (!partnerParticipant) {
      throw new NotFoundException('Partner not found in conversation');
    }

    // Get last N messages
    const messages = await this.msgRepo.find(
      { conversation: { id: conversationId }, isDeleted: false },
      {
        orderBy: { seq: 'DESC' },
        limit: messageLimit,
      }
    );

    // Reverse to get chronological order
    const chatHistory = messages.reverse().map(msg => ({
      sender: msg.sender_id,
      body: msg.body || '',
    }));

    // Get partner's profile
    const partnerProfile = await this.profileRepo.findOne({
      user: { id: partnerParticipant.user.id },
    });

    return {
      chatHistory,
      partnerProfile: partnerProfile ? {
        display_name: partnerProfile.display_name,
        bio: partnerProfile.bio,
        occupation: partnerProfile.occupation,
        tags: partnerProfile.tags,
      } : {},
      partnerId: partnerParticipant.user.id,
    };
  }
}
