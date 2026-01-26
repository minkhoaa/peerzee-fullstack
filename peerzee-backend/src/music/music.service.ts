import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

/**
 * Music Track DTO - Clean output from iTunes API
 */
export interface MusicTrackDto {
    trackId: string;
    songName: string;
    artistName: string;
    coverUrl: string;
    previewUrl: string | null;
    albumName?: string;
    genre?: string;
    durationMs?: number;
}

/**
 * iTunes API Response types
 */
interface iTunesSearchResponse {
    resultCount: number;
    results: iTunesTrack[];
}

interface iTunesTrack {
    trackId: number;
    trackName: string;
    artistName: string;
    collectionName: string;
    artworkUrl100: string;
    previewUrl?: string;
    primaryGenreName: string;
    trackTimeMillis: number;
}

@Injectable()
export class MusicService {
    private readonly logger = new Logger(MusicService.name);
    private readonly iTunesBaseUrl = 'https://itunes.apple.com';

    /**
     * Search for songs using iTunes Search API
     * @param query Search query (song name, artist)
     * @param limit Number of results (default: 5, max: 50)
     * @returns Array of MusicTrackDto
     */
    async searchSong(query: string, limit: number = 5): Promise<MusicTrackDto[]> {
        if (!query || query.trim().length === 0) {
            return [];
        }

        try {
            this.logger.log(`Searching iTunes for: "${query}"`);

            const response = await axios.get<iTunesSearchResponse>(
                `${this.iTunesBaseUrl}/search`,
                {
                    params: {
                        term: query,
                        entity: 'song',
                        limit: Math.min(limit, 50),
                        country: 'VN', // Vietnam market for Vietnamese songs
                    },
                    timeout: 10000,
                },
            );

            const tracks: MusicTrackDto[] = response.data.results
                .filter((item) => item.previewUrl) // Only include tracks with preview for AI analysis
                .map((item) => ({
                    trackId: item.trackId.toString(),
                    songName: item.trackName,
                    artistName: item.artistName,
                    coverUrl: this.getHighResCover(item.artworkUrl100),
                    previewUrl: item.previewUrl || null,
                    albumName: item.collectionName,
                    genre: item.primaryGenreName,
                    durationMs: item.trackTimeMillis,
                }));

            this.logger.log(`Found ${tracks.length} tracks with preview for "${query}"`);

            return tracks;
        } catch (error: any) {
            this.logger.error('iTunes search failed', error.message);
            throw new HttpException(
                error.response?.data?.errorMessage || 'Music search failed',
                error.response?.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Get track by ID from iTunes Lookup API
     * @param trackId iTunes track ID
     */
    async getTrackById(trackId: string): Promise<MusicTrackDto | null> {
        try {
            this.logger.log(`Fetching track: ${trackId}`);

            const response = await axios.get<iTunesSearchResponse>(
                `${this.iTunesBaseUrl}/lookup`,
                {
                    params: { id: trackId },
                    timeout: 10000,
                },
            );

            if (response.data.resultCount === 0) {
                return null;
            }

            const item = response.data.results[0] as iTunesTrack;

            return {
                trackId: item.trackId.toString(),
                songName: item.trackName,
                artistName: item.artistName,
                coverUrl: this.getHighResCover(item.artworkUrl100),
                previewUrl: item.previewUrl || null,
                albumName: item.collectionName,
                genre: item.primaryGenreName,
                durationMs: item.trackTimeMillis,
            };
        } catch (error: any) {
            this.logger.error(`Failed to fetch track ${trackId}`, error.message);
            return null;
        }
    }

    /**
     * Download audio preview as Buffer for AI analysis
     * iTunes previews are M4A format (AAC in MP4 container)
     */
    async downloadPreview(previewUrl: string): Promise<Buffer> {
        try {
            this.logger.log(`Downloading audio preview: ${previewUrl}`);

            const response = await axios.get(previewUrl, {
                responseType: 'arraybuffer',
                timeout: 30000, // 30s timeout for audio download
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; PeerzeeBot/1.0)',
                },
            });

            const buffer = Buffer.from(response.data);
            this.logger.log(`Downloaded ${buffer.length} bytes of audio`);

            return buffer;
        } catch (error: any) {
            this.logger.error('Failed to download audio preview', error.message);
            throw new HttpException(
                'Failed to download audio for analysis',
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Convert 100x100 artwork to higher resolution (600x600)
     */
    private getHighResCover(artworkUrl100: string): string {
        return artworkUrl100.replace('100x100bb', '600x600bb');
    }
}
