import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { Conversation, IcebreakerData } from '../chat/entities/conversation.entity';
import { Participant } from '../chat/entities/participants.entity';

// Icebreaker questions pool
const ICEBREAKER_QUESTIONS = [
  { id: '1', question: 'Beach or Mountain? 🏖️⛰️' },
  { id: '2', question: 'Coffee or Tea? ☕🍵' },
  { id: '3', question: 'Night owl or Early bird? 🦉🐦' },
  { id: '4', question: 'Books or Movies? 📚🎬' },
  { id: '5', question: 'Dogs or Cats? 🐕🐈' },
  { id: '6', question: 'Summer or Winter? ☀️❄️' },
  { id: '7', question: 'Pizza or Sushi? 🍕🍣' },
  { id: '8', question: 'City or Countryside? 🌆🌲' },
  { id: '9', question: 'Morning or Night person? 🌅🌙' },
  { id: '10', question: 'Sweet or Savory? 🍫🧀' },
];

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly convRepo: EntityRepository<Conversation>,
    @InjectRepository(Participant)
    private readonly partRepo: EntityRepository<Participant>,
    private readonly em: EntityManager,
  ) { }

  /**
   * Get a random icebreaker question
   */
  getRandomIcebreaker() {
    const idx = Math.floor(Math.random() * ICEBREAKER_QUESTIONS.length);
    return ICEBREAKER_QUESTIONS[idx];
  }

  /**
   * Initialize icebreaker for a new conversation
   */
  async initializeIcebreaker(conversationId: string, user1Id: string, user2Id: string) {
    const question = this.getRandomIcebreaker();
    const icebreaker: IcebreakerData = {
      questionId: question.id,
      question: question.question,
      user1Id,
      user2Id,
      isUnlocked: false,
    };

    await this.convRepo.nativeUpdate({ id: conversationId }, { icebreaker });
    return icebreaker;
  }

  /**
   * Submit icebreaker answer
   * Returns { myAnswer, partnerAnswer?, isUnlocked }
   */
  async submitIcebreakerAnswer(conversationId: string, userId: string, answer: string) {
    const conversation = await this.convRepo.findOne({ id: conversationId });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.icebreaker) {
      throw new BadRequestException('No icebreaker for this conversation');
    }

    if (conversation.icebreaker.isUnlocked) {
      throw new BadRequestException('Chat already unlocked');
    }

    const icebreaker = { ...conversation.icebreaker };

    // Determine which user is answering
    if (userId === icebreaker.user1Id) {
      if (icebreaker.answerUser1) {
        throw new BadRequestException('You already answered');
      }
      icebreaker.answerUser1 = answer;
    } else if (userId === icebreaker.user2Id) {
      if (icebreaker.answerUser2) {
        throw new BadRequestException('You already answered');
      }
      icebreaker.answerUser2 = answer;
    } else {
      throw new BadRequestException('You are not part of this conversation');
    }

    // Check if both answered
    if (icebreaker.answerUser1 && icebreaker.answerUser2) {
      icebreaker.isUnlocked = true;
    }

    // Save updated icebreaker
    await this.convRepo.nativeUpdate({ id: conversationId }, { icebreaker });

    // Return response based on who answered
    const isUser1 = userId === icebreaker.user1Id;
    return {
      ok: true,
      myAnswer: isUser1 ? icebreaker.answerUser1 : icebreaker.answerUser2,
      partnerAnswer: icebreaker.isUnlocked
        ? (isUser1 ? icebreaker.answerUser2 : icebreaker.answerUser1)
        : undefined,
      isUnlocked: icebreaker.isUnlocked,
      question: icebreaker.question,
    };
  }

  /**
   * Get conversation with icebreaker status
   */
  async getConversationWithIcebreaker(conversationId: string, userId: string): Promise<any> {
    const conversation = await this.convRepo.findOne(
      { id: conversationId },
      { populate: ['participants'] }
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Format icebreaker response (hide partner's answer if not unlocked)
    let icebreakerResponse: any = null;
    if (conversation.icebreaker) {
      const ice = conversation.icebreaker;
      const isUser1 = userId === ice.user1Id;
      icebreakerResponse = {
        question: ice.question,
        myAnswer: isUser1 ? ice.answerUser1 : ice.answerUser2,
        partnerAnswer: ice.isUnlocked
          ? (isUser1 ? ice.answerUser2 : ice.answerUser1)
          : undefined,
        isUnlocked: ice.isUnlocked,
        hasAnswered: isUser1 ? !!ice.answerUser1 : !!ice.answerUser2,
      };
    }

    return {
      ...conversation,
      icebreaker: icebreakerResponse,
    };
  }

  async findAllByUserId(user_id: string): Promise<any[]> {
    const participants = await this.partRepo.find(
      { user: { id: user_id } },
      { populate: ['conversation', 'conversation.participants', 'conversation.participants.user', 'conversation.participants.user.profile'] }
    );

    return participants.map((p) => {
      const conv = p.conversation;
      // Format icebreaker for list view
      let icebreakerStatus: any = null;
      if (conv.icebreaker) {
        const isUser1 = user_id === conv.icebreaker.user1Id;
        icebreakerStatus = {
          question: conv.icebreaker.question,
          isUnlocked: conv.icebreaker.isUnlocked,
          hasAnswered: isUser1 ? !!conv.icebreaker.answerUser1 : !!conv.icebreaker.answerUser2,
        };
      }

      return {
        ...conv,
        icebreaker: icebreakerStatus,
        participantIds: conv.participants?.map((part) => part.user.id) || [],
        participantInfo: conv.participants?.map((part) => ({
          user_id: part.user.id,
          email: part.user?.email,
          display_name: part.user?.profile?.display_name || part.user?.email?.split('@')[0],
        })) || [],
      };
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} conversation`;
  }

  update(id: number, updateConversationDto: UpdateConversationDto) {
    return `This action updates a #${id} conversation`;
  }

  remove(id: number) {
    return `This action removes a #${id} conversation`;
  }
}


