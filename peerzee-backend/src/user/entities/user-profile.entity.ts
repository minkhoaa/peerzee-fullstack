import { Entity, PrimaryKey, Property, OneToOne, Enum } from '@mikro-orm/core';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { v4 as uuid } from 'uuid';

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


@Entity({ tableName: 'user_profiles' })
export class UserProfile {
  @ApiProperty()
  @PrimaryKey({ type: 'uuid' })
  id: string = uuid();

  @ApiProperty()
  @Property({ nullable: true })
  display_name: string;

  @ApiProperty()
  @Property({ type: 'text', nullable: true })
  bio: string;

  @ApiProperty()
  @Property({ nullable: true })
  location: string;

  @ApiProperty({ description: 'Age of the user' })
  @Property({ type: 'int', nullable: true })
  age: number;

  @ApiProperty({ description: 'Occupation/Job title' })
  @Property({ nullable: true })
  occupation: string;

  @ApiProperty({ description: 'Education/School' })
  @Property({ nullable: true })
  education: string;

  @ApiProperty({ description: 'Height in cm' })
  @Property({ nullable: true })
  height: string;

  @ApiProperty({ description: 'Zodiac sign' })
  @Property({ nullable: true })
  zodiac: string;

  // Rich Profile Fields (JSONB)
  @ApiProperty({ description: 'Array of profile photos' })
  @Property({ type: 'jsonb', nullable: true })
  photos: ProfilePhoto[] = [];

  @ApiProperty({ description: 'Array of prompt responses' })
  @Property({ type: 'jsonb', nullable: true })
  prompts: ProfilePrompt[] = [];

  @ApiProperty({ description: 'Array of interest tags' })
  @Property({ type: 'jsonb', nullable: true })
  tags: string[] = [];

  @ApiProperty({ description: 'AI-extracted hidden keywords for enriched vector search' })
  @Property({ type: 'jsonb', nullable: true })
  hidden_keywords: string[] = [];

  @ApiProperty({ description: 'Discovery preferences' })
  @Property({ type: 'jsonb', nullable: true })
  discovery_settings: DiscoverySettings = {};

  @ApiProperty({ description: 'Spotify anthem with AI vibe analysis' })
  @Property({ type: 'jsonb', nullable: true })
  spotify: SpotifyData | null;

  @ApiProperty({ description: 'Instagram handle' })
  @Property({ nullable: true })
  instagram: string;

  // Location coordinates (for distance-based matching using Haversine formula)
  @ApiProperty({ description: 'Latitude coordinate' })
  @Property({ type: 'float', nullable: true })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @Property({ type: 'float', nullable: true })
  longitude: number;

  // Intent Mode (Bumble-style: DATE, STUDY, FRIEND)
  @ApiProperty({ description: 'User intent mode', enum: IntentMode, default: IntentMode.DATE })
  @Enum(() => IntentMode)
  intentMode: IntentMode = IntentMode.DATE;

  // Profile Properties (Notion Database Properties)
  @ApiProperty({ description: 'Rich profile properties (zodiac, mbti, habits, etc.)' })
  @Property({ type: 'jsonb', nullable: true })
  profileProperties: ProfileProperties = {};

  // ============================================================================
  // Hybrid Search Fields (for semantic + SQL filtering)
  // ============================================================================

  // Gender (hard filter)
  @ApiProperty({ description: 'User gender for filtering', enum: UserGender })
  @Enum(() => UserGender)
  @Property({ nullable: true })
  gender: UserGender;

  // Structured Location (hard filters)
  @ApiProperty({ description: 'City name for location filtering' })
  @Property({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @ApiProperty({ description: 'Region/Province name' })
  @Property({ type: 'varchar', length: 100, nullable: true })
  region: string;

  @ApiProperty({ description: 'ISO 2-letter country code' })
  @Property({ type: 'varchar', length: 2, nullable: true })
  country: string;

  // Availability Schedule (hard filter for time-based matching)
  @ApiProperty({ description: 'User availability schedule' })
  @Property({ type: 'jsonb', nullable: true })
  availability: AvailabilitySchedule = {};

  // Vector Embedding for Semantic Search (requires pgvector extension)
  // Using Google Gemini text-embedding-004 (768 dimensions)
  // CRITICAL: Use columnType to preserve vector type during schema sync
  @ApiProperty({ description: 'Bio embedding vector for semantic search (768 dimensions - Gemini)' })
  @Property({ columnType: 'vector(768)', nullable: true })
  bioEmbedding?: number[];

  @ApiProperty({ description: 'Timestamp when embedding was last updated' })
  @Property({ type: 'timestamp', nullable: true })
  embeddingUpdatedAt: Date;

  @ApiProperty({ description: 'Last time user was active (for recency scoring)' })
  @Property({ type: 'timestamp', nullable: true, onCreate: () => new Date() })
  lastActive: Date = new Date();

  // ============================================================================

  @OneToOne(() => User, (user) => user.profile, { fieldName: 'user_id' })
  user: User;
}
