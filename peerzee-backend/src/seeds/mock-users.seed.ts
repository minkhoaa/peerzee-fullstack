import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { User } from '../user/entities/user.entity';
import { UserProfile, UserGender } from '../user/entities/user-profile.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MockUsersSeed {
    private readonly logger = new Logger(MockUsersSeed.name);

    constructor(private readonly em: EntityManager) {}

    async seed(count: number = 50) {
        this.logger.log(`Seeding ${count} mock users...`);

        const cities = [
            'Hà Nội',
            'Hồ Chí Minh',
            'Đà Nẵng',
            'Hải Phòng',
            'Cần Thơ',
            'Nha Trang',
            'Vũng Tàu',
            'Huế',
            'Đà Lạt',
            'Quy Nhơn',
        ];

        const occupations = [
            'Software Engineer',
            'Designer',
            'Marketing Manager',
            'Teacher',
            'Doctor',
            'Photographer',
            'Content Creator',
            'Entrepreneur',
            'Student',
            'Freelancer',
        ];

        const tags = [
            'Coffee',
            'Travel',
            'Music',
            'Fitness',
            'Reading',
            'Cooking',
            'Photography',
            'Gaming',
            'Art',
            'Movies',
            'Yoga',
            'Dancing',
        ];

        const bios = [
            'Love exploring new places and meeting new people 🌍',
            'Coffee enthusiast and bookworm 📚☕',
            'Adventure seeker looking for the next thrill 🏔️',
            'Foodie who loves trying new restaurants 🍜',
            'Music lover and concert goer 🎵',
            'Fitness junkie and health enthusiast 💪',
            'Creative soul with a passion for art 🎨',
            'Tech geek and startup enthusiast 💻',
            'Nature lover and weekend hiker 🌲',
            'Movie buff and popcorn addict 🎬',
        ];

        const firstNames = [
            'Anh', 'Bình', 'Chi', 'Dương', 'Hà', 'Hùng', 'Lan', 'Linh',
            'Mai', 'Nam', 'Phương', 'Quân', 'Thảo', 'Trung', 'Tú', 'Vy',
        ];

        const lastNames = [
            'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng',
        ];

        const passwordHash = await bcrypt.hash('password123', 10);

        for (let i = 0; i < count; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const displayName = `${lastName} ${firstName}`;
            const email = `user${i + 1}@test.com`;

            // Check if user exists
            const existingUser = await this.em.findOne(User, { email });
            if (existingUser) {
                this.logger.log(`User ${email} already exists, skipping...`);
                continue;
            }

            // Create user
            const user = new User();
            user.email = email;
            user.password_hash = passwordHash;
            user.status = 'active';

            // Create profile
            const profile = new UserProfile();
            profile.display_name = displayName;
            profile.bio = bios[Math.floor(Math.random() * bios.length)];
            profile.location = cities[Math.floor(Math.random() * cities.length)];
            profile.age = Math.floor(Math.random() * 20) + 22; // 22-42
            profile.occupation = occupations[Math.floor(Math.random() * occupations.length)];
            profile.height = (Math.floor(Math.random() * 30) + 155).toString(); // 155-185
            profile.gender = i % 2 === 0 ? UserGender.MALE : UserGender.FEMALE;
            
            // Random tags (3-5)
            const numTags = Math.floor(Math.random() * 3) + 3;
            const shuffled = [...tags].sort(() => 0.5 - Math.random());
            profile.tags = shuffled.slice(0, numTags);

            profile.user = user;

            this.em.persist(user);
            this.em.persist(profile);
        }

        await this.em.flush();
        this.logger.log(`✅ Successfully seeded ${count} mock users`);
    }
}
