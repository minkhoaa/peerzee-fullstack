import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserProfile, ProfilePhoto } from './entities/user-profile.entity';
import {
    UpdateProfileDto,
    AddPhotoDto,
    ReorderPhotosDto,
    ProfileResponseDto,
} from './dto/profile.dto';
import { v4 as uuidv4 } from 'uuid';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ProfileService {
    private readonly logger = new Logger(ProfileService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(UserProfile)
        private readonly profileRepo: Repository<UserProfile>,
        private readonly aiService: AiService,
    ) { }

    /**
     * Check if embedding-relevant fields were modified
     */
    private shouldRegenerateEmbedding(dto: UpdateProfileDto): boolean {
        return (
            dto.bio !== undefined ||
            dto.occupation !== undefined ||
            dto.tags !== undefined ||
            dto.education !== undefined ||
            dto.location !== undefined
        );
    }

    /**
     * Get full profile with all rich data
     */
    async getFullProfile(userId: string): Promise<ProfileResponseDto> {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['profile'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Create profile if it doesn't exist
        let profile = user.profile;
        if (!profile) {
            profile = await this.profileRepo.save({
                user_id: userId,
                display_name: user.email.split('@')[0],
                photos: [],
                prompts: [],
                tags: [],
                discovery_settings: {},
            });
        }

        return this.mapToResponseDto(user, profile);
    }

    /**
     * Update profile with partial data
     */
    async updateProfile(
        userId: string,
        dto: UpdateProfileDto,
    ): Promise<ProfileResponseDto> {
        let profile = await this.profileRepo.findOne({
            where: { user_id: userId },
        });

        if (!profile) {
            // Create profile if it doesn't exist
            profile = await this.profileRepo.save({
                user_id: userId,
                display_name: dto.display_name,
                bio: dto.bio,
                photos: [],
                prompts: [],
                tags: [],
                discovery_settings: {},
            });
        }

        // Update fields
        if (dto.display_name !== undefined) profile.display_name = dto.display_name;
        if (dto.bio !== undefined) profile.bio = dto.bio;
        if (dto.age !== undefined) profile.age = dto.age;
        if (dto.occupation !== undefined) profile.occupation = dto.occupation;
        if (dto.education !== undefined) profile.education = dto.education;
        if (dto.location !== undefined) profile.location = dto.location;
        if (dto.photos !== undefined) profile.photos = dto.photos as ProfilePhoto[];
        if (dto.prompts !== undefined) profile.prompts = dto.prompts;
        if (dto.tags !== undefined) profile.tags = dto.tags;
        if (dto.discovery_settings !== undefined) {
            profile.discovery_settings = {
                ...profile.discovery_settings,
                ...dto.discovery_settings,
            };
        }
        if (dto.spotify !== undefined) profile.spotify = dto.spotify;
        if (dto.instagram !== undefined) profile.instagram = dto.instagram;
        if (dto.latitude !== undefined) profile.latitude = dto.latitude;
        if (dto.longitude !== undefined) profile.longitude = dto.longitude;

        // Generate embedding if relevant fields changed
        if (this.shouldRegenerateEmbedding(dto)) {
            try {
                this.logger.log(`Generating embedding for user ${userId}`);
                const embedding = await this.aiService.generateProfileEmbedding(profile);
                if (embedding.length > 0) {
                    profile.bioEmbedding = embedding;
                    profile.embeddingUpdatedAt = new Date();
                }
            } catch (error) {
                this.logger.error(`Failed to generate embedding for user ${userId}`, error);
                // Don't fail the update if embedding generation fails
            }
        }

        const updatedProfile = await this.profileRepo.save(profile);

        const user = await this.userRepo.findOne({ where: { id: userId } });
        return this.mapToResponseDto(user!, updatedProfile);
    }

    /**
     * Add a new photo to profile
     */
    async addPhoto(userId: string, dto: AddPhotoDto): Promise<ProfileResponseDto> {
        let profile = await this.profileRepo.findOne({
            where: { user_id: userId },
        });

        if (!profile) {
            profile = await this.profileRepo.save({
                user_id: userId,
                photos: [],
                prompts: [],
                tags: [],
                discovery_settings: {},
            });
        }

        const photos = profile.photos || [];
        const newPhoto: ProfilePhoto = {
            id: uuidv4(),
            url: dto.url,
            isCover: dto.isCover || photos.length === 0, // First photo is cover by default
            order: photos.length,
        };

        // If this is marked as cover, unset others
        if (newPhoto.isCover) {
            photos.forEach((p) => (p.isCover = false));
        }

        photos.push(newPhoto);
        profile.photos = photos;

        const updatedProfile = await this.profileRepo.save(profile);

        const user = await this.userRepo.findOne({ where: { id: userId } });
        return this.mapToResponseDto(user!, updatedProfile);
    }

    /**
     * Reorder photos by providing new order of IDs
     */
    async reorderPhotos(
        userId: string,
        dto: ReorderPhotosDto,
    ): Promise<ProfileResponseDto> {
        const profile = await this.profileRepo.findOne({
            where: { user_id: userId },
        });

        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        const photos = profile.photos || [];
        const photoMap = new Map(photos.map((p) => [p.id, p]));

        // Reorder based on provided IDs
        const reorderedPhotos: ProfilePhoto[] = [];
        dto.photoIds.forEach((id, index) => {
            const photo = photoMap.get(id);
            if (photo) {
                photo.order = index;
                photo.isCover = index === 0; // First photo is cover
                reorderedPhotos.push(photo);
            }
        });

        profile.photos = reorderedPhotos;
        const updatedProfile = await this.profileRepo.save(profile);

        const user = await this.userRepo.findOne({ where: { id: userId } });
        return this.mapToResponseDto(user!, updatedProfile);
    }

    /**
     * Map to response DTO
     */
    private mapToResponseDto(user: User, profile: UserProfile): ProfileResponseDto {
        return {
            id: user.id,
            email: user.email,
            display_name: profile.display_name || user.email.split('@')[0],
            bio: profile.bio,
            age: profile.age,
            occupation: profile.occupation,
            education: profile.education,
            location: profile.location,
            photos: profile.photos || [],
            prompts: profile.prompts || [],
            tags: profile.tags || [],
            spotify: profile.spotify || undefined,
            instagram: profile.instagram,
            discovery_settings: profile.discovery_settings,
        };
    }

    /**
     * Bulk re-index all profiles with embeddings
     * Processes in batches to avoid rate limits
     */
    async reindexAllProfiles(batchSize: number = 10): Promise<{
        total: number;
        success: number;
        failed: number;
        errors: string[];
    }> {
        const profiles = await this.profileRepo.find();
        const total = profiles.length;
        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        this.logger.log(`Starting bulk reindex for ${total} profiles (batch size: ${batchSize})`);

        // Process in batches
        for (let i = 0; i < profiles.length; i += batchSize) {
            const batch = profiles.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(total / batchSize);

            this.logger.log(`Processing batch ${batchNum}/${totalBatches}`);

            // Process batch in parallel
            const results = await Promise.allSettled(
                batch.map(async (profile) => {
                    const embedding = await this.aiService.generateProfileEmbedding(profile);
                    if (embedding.length > 0) {
                        profile.bioEmbedding = embedding;
                        profile.embeddingUpdatedAt = new Date();
                        await this.profileRepo.save(profile);
                        return { userId: profile.user_id, success: true };
                    }
                    return { userId: profile.user_id, success: false, reason: 'Empty profile' };
                }),
            );

            // Count results
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value.success) {
                    success++;
                } else {
                    failed++;
                    const reason = result.status === 'rejected'
                        ? result.reason?.message || 'Unknown error'
                        : (result.value as any).reason || 'Failed';
                    errors.push(reason);
                }
            }

            // Small delay between batches to respect rate limits
            if (i + batchSize < profiles.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        this.logger.log(`Reindex complete: ${success}/${total} success, ${failed} failed`);

        return { total, success, failed, errors: errors.slice(0, 10) }; // Limit error messages
    }
}

