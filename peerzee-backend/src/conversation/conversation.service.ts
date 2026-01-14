import { Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from 'src/chat/entities/conversation.entity';
import { Participant } from 'src/chat/entities/participants.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly convRepo: Repository<Conversation>,
    @InjectRepository(Participant)
    private readonly partRepo: Repository<Participant>,
  ) { }

  async findAllByUserId(user_id: string) {
    const participants = await this.partRepo.find({
      where: { user_id: user_id },
      relations: ['conversation', 'conversation.participants'],
    });

    return participants.map((p) => ({
      ...p.conversation,
      participantIds: p.conversation.participants?.map((part) => part.user_id) || [],
    }));
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

