import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { JwtModule } from '@nestjs/jwt';
import { WingmanService } from './wingman.service';
import { WingmanController } from './wingman.controller';
import { WingmanConversation } from '../chat/entities/wingman-conversation.entity';
import { UserProfile } from '../user/entities/user-profile.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([WingmanConversation, UserProfile]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [WingmanController],
  providers: [WingmanService],
  exports: [WingmanService],
})
export class WingmanModule {}
