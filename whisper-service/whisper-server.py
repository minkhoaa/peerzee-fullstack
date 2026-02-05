#!/usr/bin/env python3
"""
Whisper Microservice - Real-time Speech-to-Text API
Uses whisper.cpp for fast, local inference

Endpoints:
- POST /transcribe - Transcribe audio file
- POST /transcribe-stream - Transcribe raw audio bytes
- GET /health - Health check
"""

import tempfile
import os
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Paths to whisper.cpp binary and model
WHISPER_BIN = "/whisper/main"
WHISPER_MODEL = "/whisper/models/ggml-tiny.bin"

logger.info("Whisper.cpp service starting...")
logger.info(f"Binary: {WHISPER_BIN}")
logger.info(f"Model: {WHISPER_MODEL}")

# Verify files exist
if not os.path.exists(WHISPER_BIN):
    raise FileNotFoundError(f"Whisper binary not found: {WHISPER_BIN}")
if not os.path.exists(WHISPER_MODEL):
    raise FileNotFoundError(f"Whisper model not found: {WHISPER_MODEL}")

logger.info("Whisper.cpp service ready!")


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': 'tiny',
        'service': 'whisper-cpp-transcription',
        'binary': WHISPER_BIN,
        'model_path': WHISPER_MODEL
    }), 200


@app.route('/transcribe', methods=['POST'])
def transcribe():
    """
    Transcribe audio file using whisper.cpp
    
    Request:
        - file: audio file (wav, mp3, m4a, etc.)
        - language: optional language code (en, vi, ko, etc.)
    
    Response:
        {
            "text": "transcribed text",
            "language": "auto",
            "success": true
        }
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400
        
        # Get optional language parameter
        language = request.form.get('language', None)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Build whisper.cpp command
            logger.info(f"Transcribing audio: {file.filename}")
            
            cmd = [
                WHISPER_BIN,
                "-m", WHISPER_MODEL,
                "-f", temp_path,
                "--print-progress", "false",
                "--no-timestamps"
            ]
            
            # Add language if specified
            if language:
                cmd.extend(["-l", language])
            
            # Execute whisper.cpp
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                logger.error(f"Whisper.cpp failed: {result.stderr}")
                return jsonify({
                    "error": f"Whisper failed: {result.stderr}",
                    "success": False
                }), 500
            
            # Parse output (whisper.cpp prints transcription to stdout)
            text = result.stdout.strip()
            
            # Remove any [BLANK_AUDIO] markers
            text = text.replace("[BLANK_AUDIO]", "").strip()
            
            logger.info(f"Transcription successful: '{text[:50]}...'")
            
            return jsonify({
                'text': text,
                'language': language if language else 'auto',
                'success': True
            }), 200
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except subprocess.TimeoutExpired:
        logger.error("Transcription timeout")
        return jsonify({
            "error": "Transcription timeout",
            "success": False
        }), 500
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@app.route('/transcribe-stream', methods=['POST'])
def transcribe_stream():
    """
    Transcribe audio stream (raw audio bytes) using whisper.cpp
    
    Request body: raw audio bytes (16kHz, mono, 16-bit PCM)
    
    Response:
        {
            "text": "transcribed text",
            "language": "auto",
            "success": true
        }
    """
    try:
        # Get raw audio data
        audio_data = request.get_data()
        
        if len(audio_data) == 0:
            return jsonify({'error': 'No audio data provided'}), 400
        
        # Create temporary WAV file path
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_path = temp_file.name
        
        # Convert raw PCM to WAV using ffmpeg
        ffmpeg_cmd = [
            "ffmpeg",
            "-f", "s16le",  # 16-bit PCM
            "-ar", "16000",  # 16kHz
            "-ac", "1",      # mono
            "-i", "pipe:0",  # read from stdin
            "-y",            # overwrite
            temp_path
        ]
        
        ffmpeg_result = subprocess.run(
            ffmpeg_cmd,
            input=audio_data,
            capture_output=True,
            timeout=10
        )
        
        if ffmpeg_result.returncode != 0:
            logger.error(f"FFmpeg conversion failed: {ffmpeg_result.stderr.decode()}")
            return jsonify({
                "error": f"Audio conversion failed: {ffmpeg_result.stderr.decode()}",
                "success": False
            }), 500
        
        try:
            # Call whisper.cpp binary
            cmd = [
                WHISPER_BIN,
                "-m", WHISPER_MODEL,
                "-f", temp_path,
                "--print-progress", "false",
                "--no-timestamps"
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                logger.error(f"Whisper.cpp failed: {result.stderr}")
                return jsonify({
                    "error": f"Whisper failed: {result.stderr}",
                    "success": False
                }), 500
            
            text = result.stdout.strip()
            text = text.replace("[BLANK_AUDIO]", "").strip()
            
            return jsonify({
                'text': text,
                'language': 'auto',
                'success': True
            }), 200
            
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except subprocess.TimeoutExpired:
        logger.error("Stream transcription timeout")
        return jsonify({
            "error": "Transcription timeout",
            "success": False
        }), 500
    except Exception as e:
        logger.error(f"Stream transcription error: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


if __name__ == '__main__':
    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=False)
