import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { WhisperService } from '../whisper/whisper.service';

export interface TranslationResult {
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    confidence: number;
}

/**
 * TranslationService - Real-time speech translation for video calls
 * 
 * Architecture:
 * 1. Audio chunks → WhisperService (local GPU transcription)
 * 2. Detected text → Google Translate API (translation)
 * 3. Translated text → WebSocket (subtitles)
 * 
 * Fallback: If Whisper unavailable, uses Gemini for transcription
 * Fallback: If Google Translate unavailable, uses Gemini for translation
 */
@Injectable()
export class TranslationService {
    private readonly logger = new Logger(TranslationService.name);
    private readonly genAI: GoogleGenerativeAI;
    
    // Audio buffer per user (accumulate chunks)
    private audioBuffers: Map<string, Buffer[]> = new Map();
    
    // Translation cache (avoid re-translating same text)
    private translationCache: Map<string, TranslationResult> = new Map();

    constructor(private readonly whisperService: WhisperService) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            this.logger.warn('GEMINI_API_KEY not set - Translation will not work');
        }
        this.genAI = new GoogleGenerativeAI(apiKey || '');
    }

    /**
     * Start translation session for a user
     */
    async startTranslation(
        sessionId: string,
        userId: string,
        sourceLanguage: string,
        targetLanguage: string,
    ): Promise<void> {
        const key = `${sessionId}:${userId}`;
        
        // Initialize audio buffer
        this.audioBuffers.set(key, []);
        
        this.logger.log(`Translation started: ${sourceLanguage} → ${targetLanguage} (${key})`);
    }

    /**
     * Process audio chunk
     * Accumulate chunks and transcribe when buffer is large enough
     */
    async processAudioChunk(
        sessionId: string,
        userId: string,
        audioChunk: Buffer,
    ): Promise<string | null> {
        const key = `${sessionId}:${userId}`;
        
        // Add to buffer
        let buffer = this.audioBuffers.get(key) || [];
        buffer.push(audioChunk);
        this.audioBuffers.set(key, buffer);

        // If buffer is large enough (e.g., 1-2 seconds), transcribe
        const totalSize = buffer.reduce((sum, chunk) => sum + chunk.length, 0);
        if (totalSize < 32000) { // ~1s of audio at 16kHz
            return null;
        }

        // Merge buffer
        const mergedBuffer = Buffer.concat(buffer);
        this.audioBuffers.set(key, []); // Clear buffer

        // Transcribe using Whisper
        const text = await this.transcribeAudio(mergedBuffer);
        return text;
    }

    /**
     * Transcribe audio using local Whisper service
     */
    private async transcribeAudio(audioBuffer: Buffer): Promise<string | null> {
        try {
            const result = await this.whisperService.transcribe(audioBuffer);
            
            if (result.text) {
                this.logger.log(`Whisper: "${result.text.substring(0, 50)}..."`);
                return result.text;
            }

            return null;
        } catch (error) {
            this.logger.error('Whisper transcription error, using Gemini fallback:', error);
            return await this.transcribeWithGemini(audioBuffer);
        }
    }


    /**
     * Fallback: Transcribe using Gemini (slower but works without Whisper service)
     */
    private async transcribeWithGemini(audioBuffer: Buffer): Promise<string | null> {
        try {
            // Convert audio buffer to base64
            const base64Audio = audioBuffer.toString('base64');

            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            
            const result = await model.generateContent([
                {
                    inlineData: {
                        mimeType: 'audio/wav',
                        data: base64Audio,
                    },
                },
                { text: 'Transcribe this audio to text. Only return the transcription, nothing else.' },
            ]);

            const text = result.response.text();
            return text.trim() || null;
        } catch (error) {
            this.logger.error('Gemini transcription error:', error);
            return null;
        }
    }

    /**
     * Translate text from source to target language using Google Translate API
     */
    async translate(
        text: string,
        sourceLanguage: string,
        targetLanguage: string,
    ): Promise<TranslationResult | null> {
        if (!text || text.trim().length === 0) {
            return null;
        }

        // Check cache
        const cacheKey = `${text}:${sourceLanguage}:${targetLanguage}`;
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey)!;
        }

        try {
            // Use Google Translate API v2 (REST API)
            const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
            
            if (!apiKey) {
                this.logger.warn('GOOGLE_TRANSLATE_API_KEY not set, using Gemini fallback');
                return await this.translateWithGemini(text, sourceLanguage, targetLanguage);
            }

            const url = 'https://translation.googleapis.com/language/translate/v2';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                    source: sourceLanguage,
                    target: targetLanguage,
                    key: apiKey,
                    format: 'text',
                }),
            });

            if (!response.ok) {
                throw new Error(`Google Translate API error: ${response.statusText}`);
            }

            const data = await response.json();
            const translatedText = data.data.translations[0].translatedText;

            const translationResult: TranslationResult = {
                originalText: text,
                translatedText,
                sourceLanguage,
                targetLanguage,
                confidence: 1.0, // Google Translate is high quality
            };

            // Cache result
            this.translationCache.set(cacheKey, translationResult);

            // Limit cache size
            if (this.translationCache.size > 1000) {
                const firstKey = this.translationCache.keys().next().value;
                this.translationCache.delete(firstKey);
            }

            return translationResult;
        } catch (error) {
            this.logger.error('Translation error:', error);
            // Fallback to Gemini
            return await this.translateWithGemini(text, sourceLanguage, targetLanguage);
        }
    }

    /**
     * Fallback translation using Gemini (if Google Translate fails)
     */
    private async translateWithGemini(
        text: string,
        sourceLanguage: string,
        targetLanguage: string,
    ): Promise<TranslationResult | null> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            
            const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}.
Only return the translated text, nothing else.

Text: ${text}`;

            const result = await model.generateContent(prompt);
            const translatedText = result.response.text().trim();

            return {
                originalText: text,
                translatedText,
                sourceLanguage,
                targetLanguage,
                confidence: 0.85,
            };
        } catch (error) {
            this.logger.error('Gemini translation fallback failed:', error);
            return null;
        }
    }

    /**
     * Stop translation session
     */
    async stopTranslation(sessionId: string, userId: string): Promise<void> {
        const key = `${sessionId}:${userId}`;
        
        // Clean up audio buffer
        this.audioBuffers.delete(key);

        this.logger.log(`Translation stopped: ${key}`);
    }

    /**
     * Detect language from text
     */
    async detectLanguage(text: string): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            
            const prompt = `Detect the language of this text and return ONLY the language name in English (e.g., "English", "Vietnamese", "Korean"):

${text}`;

            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (error) {
            this.logger.error('Language detection error:', error);
            return 'Unknown';
        }
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages(): string[] {
        return [
            'English',
            'Vietnamese',
            'Korean',
            'Japanese',
            'Chinese',
            'Spanish',
            'French',
            'German',
            'Thai',
            'Indonesian',
        ];
    }
}
