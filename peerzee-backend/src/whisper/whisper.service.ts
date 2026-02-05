import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { spawn } from 'child_process';
import { createWriteStream, promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

@Injectable()
export class WhisperService implements OnModuleInit {
  private readonly logger = new Logger(WhisperService.name);
  private whisperBin: string;
  private whisperModel: string;
  private gpuType: 'cuda' | 'metal' | 'cpu' = 'cpu';

  async onModuleInit() {
    // Check if running in Docker (use whisper service) or local (use binary)
    const whisperServiceUrl = process.env.WHISPER_SERVICE_URL;
    
    if (whisperServiceUrl) {
      this.logger.log(`✓ Using Whisper service at: ${whisperServiceUrl}`);
      return; // Use HTTP API mode
    }

    // Local mode - detect whisper.cpp binary
    const homeDir: string = process.env.HOME || process.env.USERPROFILE || '/root';
    const whisperDir = join(homeDir, '.local/whisper.cpp/whisper.cpp');
    
    this.whisperBin = join(whisperDir, 'build/bin/whisper-cli');
    this.whisperModel = process.env.WHISPER_MODEL_PATH || 
                        join(whisperDir, 'models/ggml-base.bin');

    // Detect GPU
    try {
      await fs.access('/proc/driver/nvidia/version');
      this.gpuType = 'cuda';
    } catch {
      if (process.platform === 'darwin') {
        this.gpuType = 'metal';
      }
    }

    // Verify files exist
    try {
      await fs.access(this.whisperBin);
      await fs.access(this.whisperModel);
      this.logger.log(`✓ Whisper initialized (${this.gpuType.toUpperCase()})`);
      this.logger.log(`  Binary: ${this.whisperBin}`);
      this.logger.log(`  Model: ${this.whisperModel}`);
    } catch (error) {
      this.logger.error(`Whisper binary or model not found!`);
      this.logger.error(`Run: ./setup-whisper-gpu.sh`);
      throw error;
    }
  }

  /**
   * Transcribe audio buffer to text
   */
  async transcribe(
    audioBuffer: Buffer,
    options?: {
      language?: string;
      format?: 'wav' | 'raw-pcm';
    },
  ): Promise<{ text: string; language: string }> {
    const { language, format = 'wav' } = options || {};

    // Check if using HTTP API mode (Docker)
    const whisperServiceUrl = process.env.WHISPER_SERVICE_URL;
    if (whisperServiceUrl) {
      return this.transcribeViaHTTP(audioBuffer, language);
    }

    // Local binary mode
    const tempFile = join(tmpdir(), `whisper-${Date.now()}.wav`);
    
    try {
      // Write audio to temp file
      await fs.writeFile(tempFile, audioBuffer);

      // Build command
      const args = [
        '-m', this.whisperModel,
        '-f', tempFile,
        '--no-timestamps',
        '-nt', // No timestamps in output
      ];

      if (language) {
        args.push('-l', language);
      }

      // Execute whisper
      const result = await this.executeWhisper(args);

      // Parse output
      const text = this.parseOutput(result);

      return {
        text,
        language: language || 'auto',
      };
    } finally {
      // Cleanup
      try {
        await fs.unlink(tempFile);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Transcribe audio file path
   */
  async transcribeFile(
    filePath: string,
    language?: string,
  ): Promise<{ text: string; language: string }> {
    const args = [
      '-m', this.whisperModel,
      '-f', filePath,
      '--no-timestamps',
      '-nt',
    ];

    if (language) {
      args.push('-l', language);
    }

    const result = await this.executeWhisper(args);
    const text = this.parseOutput(result);

    return { text, language: language || 'auto' };
  }

  /**
   * Health check
   */
  getHealth() {
    return {
      status: 'healthy',
      model: 'base',
      gpu: this.gpuType,
      binary: this.whisperBin,
      modelPath: this.whisperModel,
    };
  }

  /**
   * Execute whisper binary
   */
  private executeWhisper(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.whisperBin, args);

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`Whisper failed: ${stderr}`);
          reject(new Error(`Whisper process exited with code ${code}`));
        } else {
          resolve(stdout);
        }
      });

      process.on('error', (error) => {
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        process.kill();
        reject(new Error('Whisper transcription timeout'));
      }, 30000);
    });
  }

  /**
   * Parse whisper output to extract text
   */
  private parseOutput(output: string): string {
    const lines = output.split('\n');
    const transcription: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines, timestamps, and metadata
      if (
        trimmed &&
        !trimmed.startsWith('[') &&
        !trimmed.startsWith('whisper_') &&
        !trimmed.includes('system_info:') &&
        !trimmed.includes('processing')
      ) {
        transcription.push(trimmed);
      }
    }

    return transcription
      .join(' ')
      .replace(/\[BLANK_AUDIO\]/g, '')
      .trim();
  }

  /**
   * Transcribe via HTTP API (Docker whisper service)
   */
  private async transcribeViaHTTP(
    audioBuffer: Buffer,
    language?: string,
  ): Promise<{ text: string; language: string }> {
    const whisperServiceUrl = process.env.WHISPER_SERVICE_URL;

    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', audioBuffer, {
        filename: 'audio.wav',
        contentType: 'audio/wav',
      });

      if (language) {
        form.append('language', language);
      }

      const response = await fetch(`${whisperServiceUrl}/inference`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Whisper HTTP error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.text) {
        this.logger.log(`Whisper HTTP: "${data.text.substring(0, 50)}..."`);
        return {
          text: data.text,
          language: language || 'auto',
        };
      }

      throw new Error('No transcription text returned');
    } catch (error) {
      this.logger.error(`Whisper HTTP failed: ${error.message}`);
      throw error;
    }
  }
}
