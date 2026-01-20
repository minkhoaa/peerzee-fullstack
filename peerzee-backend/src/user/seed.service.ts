import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { UserProfile, ProfilePhoto, ProfilePrompt, IntentMode, UserGender } from '../user/entities/user-profile.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Sample data for generating rich profiles
const SAMPLE_PHOTOS = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
];

const SAMPLE_NAMES_MALE = [
    'Đức Khang', 'Quốc Bảo', 'Hoàng Nam', 'Tuấn Kiệt', 'Văn Hùng',
    'Minh Đức', 'Anh Tuấn', 'Hải Long', 'Thanh Tùng', 'Công Vinh',
    'Duy Khánh', 'Thành Đạt', 'Quang Huy', 'Bảo Long', 'Đình Phúc',
];

const SAMPLE_NAMES_FEMALE = [
    'Minh Anh', 'Thu Hà', 'Linh Chi', 'Phương Thảo', 'Mai Linh',
    'Ngọc Ánh', 'Thanh Hương', 'Bích Ngọc', 'Hoàng Yến', 'Thùy Dung',
    'Kim Ngân', 'Hồng Nhung', 'Diệu Linh', 'Thảo Vy', 'Phương Anh',
];

const SAMPLE_OCCUPATIONS = [
    'UX Designer at Shopee', 'Backend Engineer at Tiki', 'Product Manager at VNG',
    'Data Scientist at Grab', 'Frontend Developer at FPT', 'DevOps Engineer at MoMo',
    'Mobile Developer at ZaloPay', 'AI Researcher at VinAI', 'Full-stack Developer',
    'Startup Founder', 'Marketing Manager', 'Business Analyst', 'QA Engineer',
    'Cloud Architect', 'Blockchain Developer',
];

const SAMPLE_EDUCATIONS = [
    'RMIT University', 'Bach Khoa University', 'FPT University',
    'National University', 'University of Technology', 'Academy of Finance',
    'Foreign Trade University', 'Banking Academy', 'Hanoi University',
];

const SAMPLE_CITIES = [
    'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
    'Nha Trang', 'Huế', 'Vũng Tàu', 'Biên Hòa', 'Thủ Đức',
];

const SAMPLE_REGIONS = [
    'Miền Bắc', 'Miền Nam', 'Miền Trung', 'Miền Nam', 'Miền Nam',
    'Miền Trung', 'Miền Trung', 'Miền Nam', 'Miền Nam', 'Miền Nam',
];

const SAMPLE_TAGS = [
    'Coding', 'Coffee', 'Gym', 'Travel', 'K-Drama', 'Gaming', 'Music',
    'Photography', 'Hiking', 'Yoga', 'Cooking', 'Reading', 'Netflix',
    'React', 'NextJS', 'Python', 'AI/ML', 'Startup', 'Crypto', 'Art',
    'Dance', 'Movies', 'Foodie', 'Fashion', 'Tech', 'Sports',
];

const SAMPLE_PROMPTS: { question: string; emoji: string }[] = [
    { question: 'My zombie apocalypse plan...', emoji: '🧟' },
    { question: 'A goal I\'m working towards...', emoji: '🚀' },
    { question: 'The way to my heart is...', emoji: '💡' },
    { question: 'I\'m looking for someone who...', emoji: '🎯' },
    { question: 'My simple pleasures...', emoji: '🌟' },
    { question: 'A skill I\'m proud of...', emoji: '🎹' },
    { question: 'Unpopular opinion I have...', emoji: '🤖' },
    { question: 'My coding superpower is...', emoji: '⚡' },
    { question: 'On weekends you can find me...', emoji: '☀️' },
    { question: 'Best travel story...', emoji: '✈️' },
];

const SAMPLE_ANSWERS = [
    'Find a Starbucks, barricade the doors, and live off espresso until help arrives.',
    'Building a portfolio that makes recruiters say "we need this person."',
    'A perfectly optimized SQL query. Or tacos. Probably tacos.',
    'Can explain complex topics simply and laughs at my puns.',
    'Morning pho, perfectly synced calendars, and shipping bug-free code.',
    'I can debug production issues at 3am while half asleep.',
    'AI won\'t replace developers—developers who use AI will replace those who don\'t.',
    'Turning caffeine into code at record speed.',
    'Either hiking or binge-watching tech documentaries.',
    'Got lost in Tokyo, made friends with locals, ended up at a secret ramen spot.',
];

const SAMPLE_BIOS = [
    'Design enthusiast who believes great products start with empathy.',
    'Code by day, chess by night. I optimize everything—queries, routes, and coffee.',
    'I turn chaos into product roadmaps. My superpower? Making engineers smile.',
    'I teach machines to think, but I promise I\'m still human.',
    'Passionate about clean code and clean designs.',
    'Startup survivor. Moved fast, broke things, fixed them faster.',
    'Part developer, part designer, full-time coffee addict.',
    'Building the future, one commit at a time.',
    'Introvert who codes in public cafes. The contradictions are real.',
    'Remote worker exploring Vietnam one coffee shop at a time.',
    'Thích học hỏi điều mới, luôn tìm kiếm cơ hội phát triển bản thân.',
    'Đam mê công nghệ và muốn kết nối với những người cùng đam mê.',
    'Yêu thích du lịch, khám phá ẩm thực và văn hóa các vùng miền.',
    'Thích đọc sách và cafe vào cuối tuần.',
    'Đang tìm kiếm bạn học để cùng nhau phát triển kỹ năng.',
];

const SAMPLE_SPOTIFY = [
    { song: 'Hẹn Ước Từ Hư Vô', artist: 'Mỹ Tâm' },
    { song: 'Chạy Ngay Đi', artist: 'Sơn Tùng M-TP' },
    { song: 'Đông Kiếm Em', artist: 'Vũ.' },
    { song: 'Có Chắc Yêu Là Đây', artist: 'Sơn Tùng M-TP' },
    { song: 'See Tình', artist: 'Hoàng Thùy Linh' },
];

@Injectable()
export class SeedService {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(UserProfile)
        private readonly profileRepo: Repository<UserProfile>,
    ) { }

    /**
     * Seed 50 test users with full profile data for hybrid search testing
     * Email: test1@gmail.com, test2@gmail.com, ...
     * Password: Khoa040505@
     */
    async seedTestUsers(count: number = 50): Promise<{ created: number; skipped: number }> {
        this.logger.log(`Starting to seed ${count} test users...`);

        const passwordHash = await bcrypt.hash('Khoa040505@', 12);
        let created = 0;
        let skipped = 0;

        for (let i = 1; i <= count; i++) {
            const email = `test${i}@gmail.com`;

            // Check if user already exists
            const existing = await this.userRepo.findOne({ where: { email } });
            if (existing) {
                this.logger.log(`User ${email} already exists, skipping.`);
                skipped++;
                continue;
            }

            // Determine gender (alternating for variety)
            const isFemale = i % 2 === 0;
            const gender = isFemale ? UserGender.FEMALE : UserGender.MALE;
            const names = isFemale ? SAMPLE_NAMES_FEMALE : SAMPLE_NAMES_MALE;
            const name = names[i % names.length];

            // Create user
            const user = await this.userRepo.save({
                email,
                password_hash: passwordHash,
                status: 'active',
            });

            // Determine intent mode (variety)
            const intentModes = [IntentMode.DATE, IntentMode.STUDY, IntentMode.FRIEND];
            const intentMode = intentModes[i % 3];

            // Create rich profile with hybrid search fields
            const cityIndex = i % SAMPLE_CITIES.length;
            const photos = this.generatePhotos(i);
            const prompts = this.generatePrompts();
            const tags = this.generateTags();

            await this.profileRepo.save({
                user_id: user.id,
                display_name: name,
                bio: SAMPLE_BIOS[i % SAMPLE_BIOS.length],
                age: 20 + Math.floor(Math.random() * 12), // 20-31
                occupation: SAMPLE_OCCUPATIONS[i % SAMPLE_OCCUPATIONS.length],
                education: SAMPLE_EDUCATIONS[i % SAMPLE_EDUCATIONS.length],
                location: SAMPLE_CITIES[cityIndex],
                photos,
                prompts,
                tags,
                spotify: SAMPLE_SPOTIFY[i % SAMPLE_SPOTIFY.length],
                instagram: `@${name.toLowerCase().replace(' ', '')}`,
                discovery_settings: {
                    minAge: 18,
                    maxAge: 35,
                    maxDistance: 50,
                    genderPreference: 'all',
                },
                // Hybrid Search Fields
                gender,
                intentMode,
                city: SAMPLE_CITIES[cityIndex],
                region: SAMPLE_REGIONS[cityIndex],
                country: 'VN',
                availability: {
                    weekdayMorning: Math.random() > 0.5,
                    weekdayAfternoon: Math.random() > 0.5,
                    weekdayEvening: Math.random() > 0.3,
                    weekendMorning: Math.random() > 0.4,
                    weekendAfternoon: Math.random() > 0.3,
                    weekendEvening: Math.random() > 0.3,
                },
                latitude: 10.762622 + (Math.random() - 0.5) * 2,
                longitude: 106.660172 + (Math.random() - 0.5) * 2,
            });

            created++;
            this.logger.log(`Created user ${i}/${count}: ${email} (${name}, ${gender}, ${intentMode})`);
        }

        this.logger.log(`Seeding complete. Created: ${created}, Skipped: ${skipped}`);
        return { created, skipped };
    }

    /**
     * Legacy seed method for demo users
     */
    async seedDummyUsers(count: number = 10): Promise<void> {
        this.logger.log(`Starting to seed ${count} dummy users...`);

        const existingCount = await this.userRepo.count();
        if (existingCount >= count + 2) {
            this.logger.log('Sufficient users already exist, skipping seed.');
            return;
        }

        const passwordHash = await bcrypt.hash('Password123!', 12);

        for (let i = 0; i < count; i++) {
            const names = [...SAMPLE_NAMES_MALE, ...SAMPLE_NAMES_FEMALE];
            const name = names[i % names.length];
            const email = `demo${i + 1}@peerzee.com`;

            const existing = await this.userRepo.findOne({ where: { email } });
            if (existing) {
                this.logger.log(`User ${email} already exists, skipping.`);
                continue;
            }

            const user = await this.userRepo.save({
                email,
                password_hash: passwordHash,
                status: 'active',
            });

            const photos = this.generatePhotos(i);
            const prompts = this.generatePrompts();
            const tags = this.generateTags();

            await this.profileRepo.save({
                user_id: user.id,
                display_name: name,
                bio: SAMPLE_BIOS[i % SAMPLE_BIOS.length],
                age: 22 + Math.floor(Math.random() * 10),
                occupation: SAMPLE_OCCUPATIONS[i % SAMPLE_OCCUPATIONS.length],
                education: SAMPLE_EDUCATIONS[i % SAMPLE_EDUCATIONS.length],
                location: ['Ho Chi Minh City', 'Hanoi', 'Da Nang'][i % 3],
                photos,
                prompts,
                tags,
                spotify: SAMPLE_SPOTIFY[i % SAMPLE_SPOTIFY.length],
                instagram: `@${name.toLowerCase().replace(' ', '')}`,
                discovery_settings: {
                    minAge: 18,
                    maxAge: 35,
                    maxDistance: 50,
                    genderPreference: 'all',
                },
                latitude: 10.762622 + (Math.random() - 0.5) * 0.1,
                longitude: 106.660172 + (Math.random() - 0.5) * 0.1,
            });

            this.logger.log(`Created user: ${email} (${name})`);
        }

        this.logger.log(`Seeding complete. Total users: ${await this.userRepo.count()}`);
    }

    private generatePhotos(index: number): ProfilePhoto[] {
        const photoCount = 1 + Math.floor(Math.random() * 3);
        const photos: ProfilePhoto[] = [];

        for (let i = 0; i < photoCount; i++) {
            photos.push({
                id: uuidv4(),
                url: SAMPLE_PHOTOS[(index + i) % SAMPLE_PHOTOS.length],
                isCover: i === 0,
                order: i,
            });
        }

        return photos;
    }

    private generatePrompts(): ProfilePrompt[] {
        const promptCount = 2 + Math.floor(Math.random() * 2);
        const prompts: ProfilePrompt[] = [];
        const usedIndices = new Set<number>();

        for (let i = 0; i < promptCount; i++) {
            let idx: number;
            do {
                idx = Math.floor(Math.random() * SAMPLE_PROMPTS.length);
            } while (usedIndices.has(idx));
            usedIndices.add(idx);

            prompts.push({
                id: uuidv4(),
                question: SAMPLE_PROMPTS[idx].question,
                emoji: SAMPLE_PROMPTS[idx].emoji,
                answer: SAMPLE_ANSWERS[idx % SAMPLE_ANSWERS.length],
            });
        }

        return prompts;
    }

    private generateTags(): string[] {
        const tagCount = 4 + Math.floor(Math.random() * 4);
        const shuffled = [...SAMPLE_TAGS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, tagCount);
    }
}
