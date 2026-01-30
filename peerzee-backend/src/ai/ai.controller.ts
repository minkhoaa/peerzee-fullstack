import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '../user/guards/auth.guard';

// DTOs for request validation
class AnalyzeCompatibilityDto {
    userProfile: {
        interests?: string[];
        bio?: string;
        occupation?: string;
        intentMode?: string;
        tags?: string[];
    };
    targetProfile: {
        interests?: string[];
        bio?: string;
        occupation?: string;
        intentMode?: string;
        tags?: string[];
    };
}

class GenerateIcebreakerDto {
    targetProfile: {
        bio?: string;
        tags?: string[];
        occupation?: string;
        display_name?: string;
        interests?: string[];
    };
}

class RewriteBioDto {
    rawBio: string;
}

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    /**
     * 🔮 THE ORACLE: Analyze compatibility between two profiles
     * POST /ai/analyze-compatibility
     */
    @Post('analyze-compatibility')
    async analyzeCompatibility(@Body() dto: AnalyzeCompatibilityDto) {
        return this.aiService.analyzeCompatibility(dto.userProfile, dto.targetProfile);
    }

    /**
     * 🎭 THE BARD: Generate 3 icebreaker options
     * POST /ai/generate-icebreaker
     */
    @Post('generate-icebreaker')
    async generateIcebreaker(@Body() dto: GenerateIcebreakerDto) {
        return this.aiService.generateIcebreakerOptions(dto.targetProfile);
    }

    /**
     * 📜 THE SCRIBE: Rewrite bio in RPG style
     * POST /ai/rewrite-bio
     */
    @Post('rewrite-bio')
    async rewriteBio(@Body() dto: RewriteBioDto) {
        return this.aiService.rewriteBioRPG(dto.rawBio);
    }
}
