import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

// JSONB Types for Rich Profile
export interface ProfilePhoto {
  id: string;
  url: string;
  isCover?: boolean;
  order?: number;
}

export interface ProfilePrompt {
  id: string;
  question: string;
  answer: string;
  emoji?: string;
}

// Intent Mode Enum (Bumble-style)
export enum IntentMode {
  DATE = 'DATE',
  STUDY = 'STUDY',
  FRIEND = 'FRIEND',
}

// User Gender Enum (for hard filtering)
export enum UserGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NON_BINARY = 'NON_BINARY',
  OTHER = 'OTHER',
}

// Availability Schedule (for time-based filtering)
export interface AvailabilitySchedule {
  weekdayMorning?: boolean;    // 6am-12pm
  weekdayAfternoon?: boolean;  // 12pm-6pm
  weekdayEvening?: boolean;    // 6pm-10pm
  weekendMorning?: boolean;
  weekendAfternoon?: boolean;
  weekendEvening?: boolean;
}

// Music Vibe Analysis (AI-generated)
export interface MusicVibeAnalysis {
  mood: string;           // e.g., 'Chill', 'Energetic', 'Melancholic', 'Romantic'
  color: string;          // Hex code representing the mood
  keywords: string[];     // 3 adjectives describing listener's personality
  quote: string;          // A short meaningful line or vibe description
  match_vibe: string;     // What kind of person/music matches this vibe
}

// Extended Spotify data with AI analysis
export interface SpotifyData {
  song: string;
  artist: string;
  analysis?: MusicVibeAnalysis;
  analyzedAt?: Date;
}

// Profile Properties (Notion Database Properties style)
export interface ProfileProperties {
  zodiac?: string;
  mbti?: string;
  habits?: string[];
  height?: string;
  languages?: string[];
  lookingFor?: string;
}

export interface DiscoverySettings {
  minAge?: number;
  maxAge?: number;
  maxDistance?: number; // in km
  genderPreference?: 'male' | 'female' | 'all';
}


@Entity('user_profiles')
export class UserProfile {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ nullable: true })
  display_name: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  bio: string;

  @ApiProperty()
  @Column({ nullable: true })
  location: string;

  @ApiProperty({ description: 'Age of the user' })
  @Column({ type: 'int', nullable: true })
  age: number;

  @ApiProperty({ description: 'Occupation/Job title' })
  @Column({ nullable: true })
  occupation: string;

  @ApiProperty({ description: 'Education/School' })
  @Column({ nullable: true })
  education: string;

  @ApiProperty({ description: 'Height in cm' })
  @Column({ nullable: true })
  height: string;

  @ApiProperty({ description: 'Zodiac sign' })
  @Column({ nullable: true })
  zodiac: string;

  // Rich Profile Fields (JSONB)
  @ApiProperty({ description: 'Array of profile photos' })
  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  photos: ProfilePhoto[];

  @ApiProperty({ description: 'Array of prompt responses' })
  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  prompts: ProfilePrompt[];

  @ApiProperty({ description: 'Array of interest tags' })
  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  tags: string[];

  @ApiProperty({ description: 'AI-extracted hidden keywords for enriched vector search' })
  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  hidden_keywords: string[];

  @ApiProperty({ description: 'Discovery preferences' })
  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  discovery_settings: DiscoverySettings;

  @ApiProperty({ description: 'Spotify anthem with AI vibe analysis' })
  @Column({ type: 'jsonb', nullable: true })
  spotify: SpotifyData | null;

  @ApiProperty({ description: 'Instagram handle' })
  @Column({ nullable: true })
  instagram: string;

  // Location coordinates (for distance-based matching using Haversine formula)
  @ApiProperty({ description: 'Latitude coordinate' })
  @Column({ type: 'float', nullable: true })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @Column({ type: 'float', nullable: true })
  longitude: number;

  // DEPRECATED: PostGIS Location Point (kept for backward compatibility)
  // Now using pure Haversine formula with latitude/longitude columns
  // This column can be removed in a future migration
  @ApiProperty({ description: 'DEPRECATED: PostGIS geometry point (use latitude/longitude instead)' })
  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    select: false, // Don't include in regular queries
  })
  locationPoint: string; // TypeORM stores as WKT string or GeoJSON

  // Intent Mode (Bumble-style: DATE, STUDY, FRIEND)
  @ApiProperty({ description: 'User intent mode', enum: IntentMode, default: IntentMode.DATE })
  @Column({
    type: 'enum',
    enum: IntentMode,
    default: IntentMode.DATE,
  })
  intentMode: IntentMode;

  // Profile Properties (Notion Database Properties)
  @ApiProperty({ description: 'Rich profile properties (zodiac, mbti, habits, etc.)' })
  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  profileProperties: ProfileProperties;

  // ============================================================================
  // Hybrid Search Fields (for semantic + SQL filtering)
  // ============================================================================

  // Gender (hard filter)
  @ApiProperty({ description: 'User gender for filtering', enum: UserGender })
  @Column({
    type: 'enum',
    enum: UserGender,
    nullable: true,
  })
  gender: UserGender;

  // Structured Location (hard filters)
  @ApiProperty({ description: 'City name for location filtering' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @ApiProperty({ description: 'Region/Province name' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string;

  @ApiProperty({ description: 'ISO 2-letter country code' })
  @Column({ type: 'varchar', length: 2, nullable: true })
  country: string;

  // Availability Schedule (hard filter for time-based matching)
  @ApiProperty({ description: 'User availability schedule' })
  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  availability: AvailabilitySchedule;

  // Vector Embedding for Semantic Search (requires pgvector extension)
  // Using Google Gemini text-embedding-004 (768 dimensions)
  // IMPORTANT: select: false to prevent TypeORM from loading/saving this field
  // Use raw SQL for embedding operations since TypeORM can't handle pgvector type
  @ApiProperty({ description: 'Bio embedding vector for semantic search (768 dimensions - Gemini)' })
  @Column({
    type: 'float',
    array: true,
    nullable: true,
    select: false, // Don't include in regular queries
    insert: false, // Don't include in inserts (use raw SQL)
    update: false, // Don't include in updates (use raw SQL)
    comment: 'vector(768) - Google Gemini text-embedding-004',
  })
  bioEmbedding: number[];

  @ApiProperty({ description: 'Timestamp when embedding was last updated' })
  @Column({ type: 'timestamp', nullable: true })
  embeddingUpdatedAt: Date;

  @ApiProperty({ description: 'Last time user was active (for recency scoring)' })
  @Column({ type: 'timestamp', nullable: true, default: () => 'NOW()' })
  lastActive: Date;

  // ============================================================================

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  user_id: string;
}
