import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../user/guards/auth.guard';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    @ApiOperation({ summary: 'Get notifications with cursor-based pagination' })
    @ApiQuery({ name: 'cursor', required: false, description: 'Cursor for pagination (ISO date string)' })
    @ApiQuery({ name: 'limit', required: false, description: 'Number of items to fetch (default: 20)' })
    async getNotifications(
        @Req() req: { user: { sub: string } },
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: string,
    ) {
        const userId = req.user.sub;
        const parsedLimit = limit ? parseInt(limit, 10) : 20;

        return this.notificationService.getNotifications(userId, cursor, parsedLimit);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    async getUnreadCount(@Req() req: { user: { sub: string } }) {
        const userId = req.user.sub;
        const count = await this.notificationService.getUnreadCount(userId);
        return { count };
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark a specific notification as read' })
    async markAsRead(
        @Req() req: { user: { sub: string } },
        @Param('id') notificationId: string,
    ) {
        const userId = req.user.sub;
        const notification = await this.notificationService.markAsRead(notificationId, userId);

        if (!notification) {
            return { ok: false, message: 'Notification not found' };
        }

        return { ok: true, notification };
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    async markAllAsRead(@Req() req: { user: { sub: string } }) {
        const userId = req.user.sub;
        const count = await this.notificationService.markAllAsRead(userId);

        return { ok: true, count };
    }
}
