import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { VideoSession } from './entities/video-session.entity';
import { VideoDatingService } from './video-dating.service';
import { VideoDatingGateway } from './video-dating.gateway';

@Module({
    imports: [
        TypeOrmModule.forFeature([VideoSession]),
        JwtModule.register({}),
    ],
    providers: [VideoDatingService, VideoDatingGateway],
    exports: [VideoDatingService],
})
export class VideoDatingModule { }
