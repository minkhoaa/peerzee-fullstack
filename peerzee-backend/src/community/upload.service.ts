import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedMedia {
    url: string;
    type: 'image' | 'video';
    filename: string;
    originalName: string;
    size: number;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

@Injectable()
export class UploadService {
    private readonly uploadDir: string;
    private readonly baseUrl: string;

    constructor() {
        this.uploadDir = join(process.cwd(), 'uploads', 'community');
        this.baseUrl = process.env.UPLOAD_BASE_URL || 'http://localhost:9000';

        // Ensure upload directory exists
        if (!existsSync(this.uploadDir)) {
            mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Save uploaded file to disk
     */
    async saveFile(file: Express.Multer.File): Promise<UploadedMedia> {
        // Validate file type
        const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
        const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);

        if (!isImage && !isVideo) {
            throw new BadRequestException('Invalid file type. Allowed: images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV)');
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestException('File too large. Maximum size is 50MB');
        }

        // Generate unique filename
        const ext = extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        const filepath = join(this.uploadDir, filename);

        // Save file
        writeFileSync(filepath, file.buffer);

        return {
            url: `${this.baseUrl}/uploads/community/${filename}`,
            type: isImage ? 'image' : 'video',
            filename,
            originalName: file.originalname,
            size: file.size,
        };
    }

    /**
     * Save multiple files
     */
    async saveFiles(files: Express.Multer.File[]): Promise<UploadedMedia[]> {
        const results: UploadedMedia[] = [];

        for (const file of files) {
            const result = await this.saveFile(file);
            results.push(result);
        }

        return results;
    }

    /**
     * Delete a file
     */
    async deleteFile(filename: string): Promise<void> {
        const filepath = join(this.uploadDir, filename);
        try {
            if (existsSync(filepath)) {
                unlinkSync(filepath);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }
}
