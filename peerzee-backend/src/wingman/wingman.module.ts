import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { WingmanService } from './wingman.service';
import { WingmanAgenticService } from './wingman-agentic.service';
import { WingmanSchedulerService } from './wingman-scheduler.service';
import { PlacesService } from './places.service';
import { WingmanController } from './wingman.controller';
import { WingmanConversation } from '../chat/entities/wingman-conversation.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { NotificationModule } from '../notification/notification.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([WingmanConversation, UserProfile, User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    ScheduleModule.forRoot(),
    forwardRef(() => UserModule),
    NotificationModule,
    AiModule,
  ],
  controllers: [WingmanController],
  providers: [
    WingmanService,
    WingmanAgenticService,
    WingmanSchedulerService,
    PlacesService,
  ],
  exports: [WingmanService, WingmanAgenticService, PlacesService],
})
export class WingmanModule {}
