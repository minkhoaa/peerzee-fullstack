import { Controller, Post, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SeedService } from './seed.service';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
    constructor(private readonly seedService: SeedService) { }

    @Post('users')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Seed dummy users with rich profiles for testing' })
    @ApiQuery({ name: 'count', required: false, type: Number, description: 'Number of users to create (default: 10)' })
    @ApiResponse({ status: 201, description: 'Users seeded successfully' })
    async seedUsers(@Query('count') count?: number) {
        const userCount = count ? parseInt(String(count), 10) : 10;
        await this.seedService.seedDummyUsers(userCount);
        return { message: `Successfully seeded ${userCount} dummy users` };
    }
}
