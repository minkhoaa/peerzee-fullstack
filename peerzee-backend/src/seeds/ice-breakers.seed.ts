import { DataSource } from 'typeorm';
import { IceBreaker } from '../chat/entities/ice-breaker.entity';

const iceBreakers = [
    // General
    { prompt: "What's the best trip you've ever been on?", category: 'general' },
    { prompt: "Coffee or tea? And what's your order?", category: 'general' },
    { prompt: "What's the last show you binged?", category: 'general' },
    { prompt: "What's your go-to comfort food?", category: 'general' },
    { prompt: "Morning person or night owl?", category: 'general' },
    { prompt: "What's your favorite way to spend a weekend?", category: 'general' },
    { prompt: "Do you have any pets? Tell me about them!", category: 'general' },
    { prompt: "What's the last book you read?", category: 'general' },

    // Fun
    { prompt: "What's your go-to karaoke song?", category: 'fun' },
    { prompt: "What's the most spontaneous thing you've ever done?", category: 'fun' },
    { prompt: "If you could have any superpower, what would it be?", category: 'fun' },
    { prompt: "What's the weirdest food combination you secretly love?", category: 'fun' },
    { prompt: "If you won the lottery tomorrow, what's the first thing you'd do?", category: 'fun' },
    { prompt: "What's your unpopular opinion?", category: 'fun' },
    { prompt: "What's on your bucket list?", category: 'fun' },
    { prompt: "If you could travel anywhere right now, where would you go?", category: 'fun' },

    // Deep
    { prompt: "If you could have dinner with anyone, who would it be?", category: 'deep' },
    { prompt: "What's something you're really passionate about?", category: 'deep' },
    { prompt: "What's the best advice you've ever received?", category: 'deep' },
    { prompt: "What's a skill you've always wanted to learn?", category: 'deep' },
    { prompt: "What does your perfect day look like?", category: 'deep' },
    { prompt: "What's something that always makes you smile?", category: 'deep' },
    { prompt: "What motivates you to get up in the morning?", category: 'deep' },
    { prompt: "What's your love language?", category: 'deep' },

    // Flirty
    { prompt: "What's your idea of a perfect first date?", category: 'flirty' },
    { prompt: "What's the most romantic thing someone has done for you?", category: 'flirty' },
    { prompt: "Do you believe in love at first sight?", category: 'flirty' },
    { prompt: "What's your biggest turn-on in a person?", category: 'flirty' },
    { prompt: "What song makes you think of romance?", category: 'flirty' },
    { prompt: "What's your love story expectation?", category: 'flirty' },
];


export async function seedIceBreakers(dataSource: DataSource) {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
        // Check if table exists
        const tableExists = await queryRunner.hasTable('ice_breakers');

        if (!tableExists) {
            console.log('Table "ice_breakers" does not exist. Creating it...');
            await queryRunner.query(`
                CREATE TABLE "ice_breakers" (
                    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                    "prompt" text NOT NULL,
                    "category" character varying NOT NULL DEFAULT 'general',
                    "isActive" boolean NOT NULL DEFAULT true,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_ice_breakers_id" PRIMARY KEY ("id")
                )
            `);
            console.log('Table "ice_breakers" created successfully.');
        }
    } catch (err) {
        console.error('Error checking/creating ice_breakers table:', err);
    } finally {
        await queryRunner.release();
    }

    const repo = dataSource.getRepository(IceBreaker);

    // Check if already seeded
    try {
        const count = await repo.count();
        if (count > 0) {
            console.log(`Ice breakers already seeded (${count} entries). Skipping...`);
            return;
        }

        // Insert all ice breakers
        const entities = iceBreakers.map(ib => repo.create({ ...ib, isActive: true }));
        await repo.save(entities);

        console.log(`Seeded ${entities.length} ice breakers!`);
    } catch (error) {
        console.error('Error seeding ice breakers:', error);
    }
}

