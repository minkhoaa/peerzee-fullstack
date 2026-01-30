import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';

export enum IntentModeFilter {
    DATE = 'DATE',
    STUDY = 'STUDY',
    FRIEND = 'FRIEND',
}

export enum GenderPreference {
    MALE = 'male',
    FEMALE = 'female',
    ALL = 'all',
}

export enum MatchingType {
    NORMAL = 'normal',   // Random queue matching
    SEMANTIC = 'semantic', // AI semantic matching
}

export class JoinQueueDto {
    @IsEnum(IntentModeFilter)
    intentMode: IntentModeFilter;

    @IsOptional()
    @IsEnum(GenderPreference)
    genderPreference?: GenderPreference = GenderPreference.ALL;

    @IsOptional()
    @IsEnum(MatchingType)
    matchingType?: MatchingType = MatchingType.SEMANTIC; // Default to AI matching

    @IsOptional()
    @IsBoolean()
    withVideo?: boolean = true;

    @IsOptional()
    @IsString()
    query?: string; // Natural language query for RAG agent matching
}

