import { IsEnum, IsOptional, IsString } from 'class-validator';

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

export class JoinQueueDto {
    @IsEnum(IntentModeFilter)
    intentMode: IntentModeFilter;

    @IsOptional()
    @IsEnum(GenderPreference)
    genderPreference?: GenderPreference = GenderPreference.ALL;
}
