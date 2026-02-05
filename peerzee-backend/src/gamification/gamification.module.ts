import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { JwtModule } from '@nestjs/jwt';
import { GamificationService } from './gamification.service';
import { QuestService } from './quest.service';
import { GamificationController } from './gamification.controller';
import { UserGamification } from './entities/user-gamification.entity';
import { UserQuest } from './entities/quest.entity';
import { NotificationModule } from '../notification/notification.module';
import { User } from '../user/entities/user.entity';

@Module({
    imports: [
        MikroOrmModule.forFeature([UserGamification, UserQuest, User]),
        JwtModule.register({}),
        NotificationModule,
    ],
    controllers: [GamificationController],
    providers: [GamificationService, QuestService],
    exports: [GamificationService, QuestService],
})
export class GamificationModule { }
