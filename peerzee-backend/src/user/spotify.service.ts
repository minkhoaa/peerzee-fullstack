import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Spotify Track data structure
 */
export interface SpotifyTrack {
    id: string;
    name: string;
    artist: string;
    artistId: string;
    albumName: string;
    albumCover: string | null;
    previewUrl: string | null;
    externalUrl: string;
    durationMs: number;
}

/**
 * Spotify Audio Features data structure
 * See: https://developer.spotify.com/documentation/web-api/reference/get-audio-features
 */
export interface SpotifyAudioFeatures {
    danceability: number;      // 0.0 - 1.0 (How suitable for dancing)
    energy: number;            // 0.0 - 1.0 (Intensity and activity)
    valence: number;           // 0.0 - 1.0 (Musical positiveness)
    tempo: number;             // BPM
    acousticness: number;      // 0.0 - 1.0 (Confidence of acoustic)
    instrumentalness: number;  // 0.0 - 1.0 (Predicts no vocals)
    liveness: number;          // 0.0 - 1.0 (Presence of audience)
    speechiness: number;       // 0.0 - 1.0 (Presence of spoken words)
    loudness: number;          // dB (Overall loudness)
    mode: number;              // 0 = Minor, 1 = Major
    key: number;               // Pitch class (0 = C, 1 = C#, etc.)
    timeSignature: number;     // Beats per measure
}

/**
 * Full track data with audio features
 */
export interface SpotifyTrackWithFeatures extends SpotifyTrack {
    audioFeatures: SpotifyAudioFeatures | null;
}

/**
 * Search result structure
 */
export interface SpotifySearchResult {
    tracks: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
}

@Injectable()
export class SpotifyService {
    private readonly logger = new Logger(SpotifyService.name);
    private readonly clientId: string;
    private readonly clientSecret: string;
    private accessToken: string | null = null;
    private tokenExpiresAt: number = 0;
    private readonly apiClient: AxiosInstance;

    constructor(private readonly configService: ConfigService) {
        this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID') || '';
        this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET') || '';

        this.apiClient = axios.create({
            baseURL: 'https://api.spotify.com/v1',
            timeout: 10000,
        });

        // Add request interceptor to attach access token
        this.apiClient.interceptors.request.use(async (config) => {
            const token = await this.getAccessToken();
            config.headers.Authorization = `Bearer ${token}`;
            return config;
        });

        if (!this.clientId || !this.clientSecret) {
            this.logger.warn('Spotify credentials not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env');
        }
    }

    /**
     * Get access token using Client Credentials Flow
     * Automatically refreshes if expired
     */
    private async getAccessToken(): Promise<string> {
        // Return cached token if still valid (with 60s buffer)
        if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
            return this.accessToken;
        }

        if (!this.clientId || !this.clientSecret) {
            throw new HttpException(
                'Spotify credentials not configured',
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }

        try {
            this.logger.log('Requesting new Spotify access token...');

            const response = await axios.post(
                'https://accounts.spotify.com/api/token',
                new URLSearchParams({
                    grant_type: 'client_credentials',
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
                    },
                },
            );

            this.accessToken = response.data.access_token;
            // Token expires in `expires_in` seconds
            this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

            this.logger.log(`Spotify access token obtained, expires in ${response.data.expires_in}s`);

            return this.accessToken!;
        } catch (error: any) {
            this.logger.error('Failed to get Spotify access token', error.response?.data || error.message);
            throw new HttpException(
                'Failed to authenticate with Spotify',
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }
    }

    /**
     * Search for tracks by query
     * @param query Search query (song name, artist, etc.)
     * @param limit Number of results (default: 10, max: 50)
     */
    async searchTracks(query: string, limit: number = 10): Promise<SpotifySearchResult> {
        if (!query || query.trim().length === 0) {
            return { tracks: [], total: 0, limit, offset: 0 };
        }

        try {
            this.logger.log(`Searching Spotify for: "${query}"`);

            const response = await this.apiClient.get('/search', {
                params: {
                    q: query,
                    type: 'track',
                    limit: Math.min(limit, 50),
                    market: 'VN', // Vietnam market for Vietnamese songs
                },
            });

            const tracks: SpotifyTrack[] = response.data.tracks.items.map((item: any) => ({
                id: item.id,
                name: item.name,
                artist: item.artists.map((a: any) => a.name).join(', '),
                artistId: item.artists[0]?.id || '',
                albumName: item.album.name,
                albumCover: item.album.images[0]?.url || null,
                previewUrl: item.preview_url,
                externalUrl: item.external_urls.spotify,
                durationMs: item.duration_ms,
            }));

            this.logger.log(`Found ${tracks.length} tracks for "${query}"`);

            return {
                tracks,
                total: response.data.tracks.total,
                limit: response.data.tracks.limit,
                offset: response.data.tracks.offset,
            };
        } catch (error: any) {
            this.logger.error('Spotify search failed', error.response?.data || error.message);
            throw new HttpException(
                error.response?.data?.error?.message || 'Spotify search failed',
                error.response?.status || HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Get track details by ID
     */
    async getTrack(trackId: string): Promise<SpotifyTrack> {
        try {
            this.logger.log(`Fetching track details for: ${trackId}`);

            const response = await this.apiClient.get(`/tracks/${trackId}`);
            const item = response.data;

            return {
                id: item.id,
                name: item.name,
                artist: item.artists.map((a: any) => a.name).join(', '),
                artistId: item.artists[0]?.id || '',
                albumName: item.album.name,
                albumCover: item.album.images[0]?.url || null,
                previewUrl: item.preview_url,
                externalUrl: item.external_urls.spotify,
                durationMs: item.duration_ms,
            };
        } catch (error: any) {
            this.logger.error(`Failed to get track ${trackId}`, error.response?.data || error.message);
            throw new HttpException(
                error.response?.data?.error?.message || 'Failed to get track',
                error.response?.status || HttpStatus.NOT_FOUND,
            );
        }
    }

    /**
     * Get audio features for a track
     * Note: This endpoint may not be available for all tracks
     */
    async getAudioFeatures(trackId: string): Promise<SpotifyAudioFeatures | null> {
        try {
            this.logger.log(`Fetching audio features for: ${trackId}`);

            const response = await this.apiClient.get(`/audio-features/${trackId}`);
            const data = response.data;

            if (!data) {
                this.logger.warn(`No audio features available for track ${trackId}`);
                return null;
            }

            return {
                danceability: data.danceability,
                energy: data.energy,
                valence: data.valence,
                tempo: data.tempo,
                acousticness: data.acousticness,
                instrumentalness: data.instrumentalness,
                liveness: data.liveness,
                speechiness: data.speechiness,
                loudness: data.loudness,
                mode: data.mode,
                key: data.key,
                timeSignature: data.time_signature,
            };
        } catch (error: any) {
            // Audio features might not be available for all tracks
            if (error.response?.status === 404) {
                this.logger.warn(`Audio features not available for track ${trackId}`);
                return null;
            }
            this.logger.error(`Failed to get audio features for ${trackId}`, error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Get full track details including audio features
     */
    async getTrackWithFeatures(trackId: string): Promise<SpotifyTrackWithFeatures> {
        // Fetch track and audio features in parallel
        const [track, audioFeatures] = await Promise.all([
            this.getTrack(trackId),
            this.getAudioFeatures(trackId),
        ]);

        return {
            ...track,
            audioFeatures,
        };
    }

    /**
     * Helper: Convert audio features to human-readable description
     */
    describeAudioFeatures(features: SpotifyAudioFeatures): string {
        const descriptions: string[] = [];

        // Energy level
        if (features.energy > 0.8) descriptions.push('very energetic');
        else if (features.energy > 0.6) descriptions.push('energetic');
        else if (features.energy < 0.3) descriptions.push('calm');
        else if (features.energy < 0.5) descriptions.push('relaxed');

        // Mood (valence)
        if (features.valence > 0.7) descriptions.push('happy/cheerful');
        else if (features.valence > 0.5) descriptions.push('positive');
        else if (features.valence < 0.3) descriptions.push('melancholic/sad');
        else if (features.valence < 0.5) descriptions.push('bittersweet');

        // Danceability
        if (features.danceability > 0.7) descriptions.push('very danceable');
        else if (features.danceability > 0.5) descriptions.push('danceable');

        // Acousticness
        if (features.acousticness > 0.7) descriptions.push('acoustic');

        // Tempo
        if (features.tempo > 140) descriptions.push('fast-paced');
        else if (features.tempo < 80) descriptions.push('slow');

        return descriptions.join(', ') || 'balanced';
    }
}
