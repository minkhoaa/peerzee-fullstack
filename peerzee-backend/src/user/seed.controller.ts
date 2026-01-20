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

    @Post('test-users')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Seed 50 test users for hybrid search testing (test1@gmail.com - test50@gmail.com)' })
    @ApiQuery({ name: 'count', required: false, type: Number, description: 'Number of test users (default: 50)' })
    @ApiResponse({ status: 201, description: 'Test users seeded successfully' })
    async seedTestUsers(@Query('count') count?: number) {
        const userCount = count ? parseInt(String(count), 10) : 50;
        const result = await this.seedService.seedTestUsers(userCount);
        return {
            message: `Test users seeding complete`,
            created: result.created,
            skipped: result.skipped,
        };
    }
}

