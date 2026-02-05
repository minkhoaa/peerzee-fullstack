import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WhisperService } from './whisper.service';

@Controller('whisper')
export class WhisperController {
  constructor(private readonly whisperService: WhisperService) {}

  @Get('health')
  getHealth() {
    return this.whisperService.getHealth();
  }

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('file'))
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @Body('language') language?: string,
  ) {
    try {
      const result = await this.whisperService.transcribe(file.buffer, {
        language,
      });

      return {
        ...result,
        success: true,
      };
    } catch (error) {
      return {
        error: error.message,
        success: false,
      };
    }
  }

  @Post('transcribe-stream')
  async transcribeStream(@Body() body: { audio: Buffer; language?: string }) {
    try {
      const result = await this.whisperService.transcribe(body.audio, {
        language: body.language,
        format: 'raw-pcm',
      });

      return {
        ...result,
        success: true,
      };
    } catch (error) {
      return {
        error: error.message,
        success: false,
      };
    }
  }
}
