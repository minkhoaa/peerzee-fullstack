import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { Message } from './entities/message.entity';
import * as fs from 'fs';

export interface VoiceAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  emotion: string;
  confidence: number;
}

export interface VoiceProcessingResult {
  transcription: string;
  analysis: VoiceAnalysis;
  duration: number;
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly fileManager: GoogleAIFileManager;

  constructor(
    @InjectRepository(Message)
    private readonly msgRepo: EntityRepository<Message>,
    private readonly em: EntityManager,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set - voice transcription will not work');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
    this.fileManager = new GoogleAIFileManager(apiKey || '');
  }

  /**
   * Process a voice note: upload to Gemini, transcribe, and analyze sentiment
   */
  async processVoiceNote(
    filePath: string,
    mimeType: string = 'audio/webm',
  ): Promise<VoiceProcessingResult> {
    this.logger.log(`Processing voice note: ${filePath}`);

    try {
      // 1. Upload audio file to Gemini
      const uploadResult = await this.fileManager.uploadFile(filePath, {
        mimeType,
        displayName: `voice-note-${Date.now()}`,
      });

      this.logger.log(`Uploaded file: ${uploadResult.file.name}`);

      // 2. Wait for file processing
      let file = uploadResult.file;
      while (file.state === 'PROCESSING') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        file = await this.fileManager.getFile(file.name);
      }

      if (file.state === 'FAILED') {
        throw new Error('File processing failed');
      }

      // 3. Transcribe and analyze in one request using Gemini 2.5 Flash
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `You are analyzing a voice message in a dating app chat.

Please analyze this audio and provide:
1. **Transcription**: Accurate transcription of the speech (in the original language, likely Vietnamese or English)
2. **Sentiment**: Is the overall tone positive, neutral, or negative?
3. **Emotion**: What emotion is being conveyed? (happy, sad, excited, calm, nervous, playful, flirty, angry, etc.)
4. **Confidence**: How confident are you in this analysis? (0.0 to 1.0)

Respond in JSON format only:
{
  "transcription": "...",
  "sentiment": "positive" | "neutral" | "negative",
  "emotion": "...",
  "confidence": 0.0-1.0
}`;

      const result = await model.generateContent([
        prompt,
        {
          fileData: {
            fileUri: file.uri,
            mimeType: file.mimeType,
          },
        },
      ]);

      const responseText = result.response.text();
      
      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // 4. Estimate duration from file size (rough approximation)
      const stats = fs.statSync(filePath);
      const durationSeconds = Math.round(stats.size / 8000); // Very rough estimate

      // 5. Clean up uploaded file
      try {
        await this.fileManager.deleteFile(file.name);
      } catch (e) {
        this.logger.warn(`Failed to delete uploaded file: ${e}`);
      }

      return {
        transcription: parsed.transcription || '',
        analysis: {
          sentiment: parsed.sentiment || 'neutral',
          emotion: parsed.emotion || 'calm',
          confidence: parsed.confidence || 0.5,
        },
        duration: durationSeconds,
      };
    } catch (error) {
      this.logger.error('Failed to process voice note:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio only (without full analysis)
   */
  async transcribeAudio(filePath: string, mimeType: string = 'audio/webm'): Promise<string> {
    try {
      const uploadResult = await this.fileManager.uploadFile(filePath, {
        mimeType,
        displayName: `transcribe-${Date.now()}`,
      });

      let file = uploadResult.file;
      while (file.state === 'PROCESSING') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        file = await this.fileManager.getFile(file.name);
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const result = await model.generateContent([
        'Transcribe this audio message accurately. Output only the transcription, nothing else.',
        {
          fileData: {
            fileUri: file.uri,
            mimeType: file.mimeType,
          },
        },
      ]);

      // Clean up
      try {
        await this.fileManager.deleteFile(file.name);
      } catch (e) {
        this.logger.warn(`Failed to delete uploaded file: ${e}`);
      }

      return result.response.text().trim();
    } catch (error) {
      this.logger.error('Failed to transcribe audio:', error);
      throw error;
    }
  }

  /**
   * Analyze voice sentiment from existing transcription (no audio needed)
   */
  async analyzeTextSentiment(text: string): Promise<VoiceAnalysis> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `Analyze the sentiment and emotion in this text message from a dating app chat:

"${text}"

Respond in JSON format only:
{
  "sentiment": "positive" | "neutral" | "negative",
  "emotion": "happy" | "sad" | "excited" | "calm" | "nervous" | "playful" | "flirty" | "angry",
  "confidence": 0.0-1.0
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { sentiment: 'neutral', emotion: 'calm', confidence: 0.5 };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        sentiment: parsed.sentiment || 'neutral',
        emotion: parsed.emotion || 'calm',
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      this.logger.error('Failed to analyze sentiment:', error);
      return { sentiment: 'neutral', emotion: 'calm', confidence: 0.5 };
    }
  }

  /**
   * Update a message with voice analysis results
   */
  async updateMessageWithVoiceData(
    messageId: string,
    transcription: string,
    analysis: VoiceAnalysis,
    duration: number,
  ): Promise<Message> {
    const message = await this.msgRepo.findOne({ id: messageId });
    if (!message) {
      throw new Error('Message not found');
    }

    message.transcription = transcription;
    message.voiceAnalysis = analysis;
    message.audioDuration = duration;

    await this.em.flush();
    return message;
  }
}
