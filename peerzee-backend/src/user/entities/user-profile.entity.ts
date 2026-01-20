import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
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

  @ApiProperty({ description: 'Discovery preferences' })
  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  discovery_settings: DiscoverySettings;

  @ApiProperty({ description: 'Spotify anthem' })
  @Column({ type: 'jsonb', nullable: true })
  spotify: { song: string; artist: string } | null;

  @ApiProperty({ description: 'Instagram handle' })
  @Column({ nullable: true })
  instagram: string;

  // Location coordinates (for distance-based matching)
  @ApiProperty({ description: 'Latitude coordinate' })
  @Column({ type: 'float', nullable: true })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @Column({ type: 'float', nullable: true })
  longitude: number;

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
  @ApiProperty({ description: 'Bio embedding vector for semantic search (768 dimensions - Gemini)' })
  @Column({
    type: 'float',
    array: true,
    nullable: true,
    comment: 'vector(768) - Google Gemini text-embedding-004',
  })
  bioEmbedding: number[];

  @ApiProperty({ description: 'Timestamp when embedding was last updated' })
  @Column({ type: 'timestamp', nullable: true })
  embeddingUpdatedAt: Date;

  // ============================================================================

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  user_id: string;
}
