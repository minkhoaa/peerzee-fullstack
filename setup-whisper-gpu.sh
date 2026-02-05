#!/bin/bash
set -e

echo "🎤 Setting up Whisper.cpp with GPU support..."

# Detect GPU type
if command -v nvidia-smi &> /dev/null; then
    GPU_TYPE="cuda"
    echo "✓ NVIDIA GPU detected"
elif [[ "$(uname)" == "Darwin" ]]; then
    GPU_TYPE="metal"
    echo "✓ Apple Silicon detected"
else
    GPU_TYPE="cpu"
    echo "⚠ No GPU detected, will use CPU"
fi

# Install directory
WHISPER_DIR="$HOME/.local/whisper.cpp"
mkdir -p "$WHISPER_DIR"
cd "$WHISPER_DIR"

# Clone whisper.cpp if not exists
if [ ! -d "whisper.cpp" ]; then
    echo "📥 Cloning whisper.cpp..."
    git clone https://github.com/ggerganov/whisper.cpp.git
fi

cd whisper.cpp

# Pull latest changes
echo "🔄 Updating whisper.cpp..."
git pull

# Compile with GPU support
echo "🔨 Compiling whisper.cpp with $GPU_TYPE support..."

if [ "$GPU_TYPE" == "cuda" ]; then
    # CUDA compilation
    make clean
    make WHISPER_CUDA=1 -j$(nproc)
    echo "✓ Compiled with CUDA support"
    
elif [ "$GPU_TYPE" == "metal" ]; then
    # Metal compilation (Apple Silicon)
    make clean
    make WHISPER_METAL=1 -j$(sysctl -n hw.ncpu)
    echo "✓ Compiled with Metal support"
    
else
    # CPU only
    make clean
    make -j$(nproc)
    echo "✓ Compiled for CPU"
fi

# Download models
echo "📦 Downloading Whisper models..."
cd models

if [ ! -f "ggml-tiny.bin" ]; then
    echo "  - tiny (75MB) - fastest"
    bash ./download-ggml-model.sh tiny
fi

if [ ! -f "ggml-base.bin" ]; then
    echo "  - base (142MB) - balanced"
    bash ./download-ggml-model.sh base
fi

# Test whisper
echo "🧪 Testing Whisper..."
cd ..
./main -h > /dev/null && echo "✓ Whisper binary working!"

# Install Python server dependencies
echo "🐍 Installing Python dependencies..."
pip install flask flask-cors

# Create systemd service (optional)
cat > /tmp/whisper-service.txt << 'EOF'
# Systemd service file for Whisper server
# Copy to: /etc/systemd/system/whisper.service

[Unit]
Description=Whisper Speech-to-Text Service
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$WHISPER_DIR/whisper.cpp
ExecStart=/usr/bin/python3 $HOME/.local/whisper-server.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Create standalone Python server
cat > "$HOME/.local/whisper-server.py" << 'PYEOF'
#!/usr/bin/env python3
"""
Whisper.cpp GPU Server
Runs whisper.cpp with GPU acceleration for fast inference
"""

import os
import tempfile
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Paths
WHISPER_DIR = os.path.expanduser("~/.local/whisper.cpp/whisper.cpp")
WHISPER_BIN = os.path.join(WHISPER_DIR, "main")
WHISPER_MODEL = os.path.join(WHISPER_DIR, "models/ggml-base.bin")  # base model for better quality

# GPU detection
GPU_TYPE = "cpu"
if os.path.exists("/proc/driver/nvidia/version"):
    GPU_TYPE = "cuda"
elif os.uname().sysname == "Darwin":
    GPU_TYPE = "metal"

logger.info(f"Whisper server starting with {GPU_TYPE.upper()} acceleration...")
logger.info(f"Binary: {WHISPER_BIN}")
logger.info(f"Model: {WHISPER_MODEL}")

if not os.path.exists(WHISPER_BIN):
    raise FileNotFoundError(f"Whisper binary not found: {WHISPER_BIN}")
if not os.path.exists(WHISPER_MODEL):
    raise FileNotFoundError(f"Model not found: {WHISPER_MODEL}")

logger.info("✓ Whisper server ready!")


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model': 'base',
        'service': 'whisper-cpp-gpu',
        'gpu': GPU_TYPE,
        'binary': WHISPER_BIN
    }), 200


@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400
        
        language = request.form.get('language', None)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            logger.info(f"Transcribing: {file.filename} ({GPU_TYPE})")
            
            cmd = [WHISPER_BIN, "-m", WHISPER_MODEL, "-f", temp_path, "--no-timestamps", "-pp"]
            
            # GPU flags
            if GPU_TYPE == "cuda":
                cmd.append("-ng")  # Use GPU
            
            if language:
                cmd.extend(["-l", language])
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                return jsonify({"error": f"Whisper failed: {result.stderr}", "success": False}), 500
            
            text = result.stdout.strip().replace("[BLANK_AUDIO]", "").strip()
            logger.info(f"✓ Transcribed: {text[:50]}...")
            
            return jsonify({'text': text, 'language': language or 'auto', 'success': True}), 200
            
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Timeout", "success": False}), 500
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500


@app.route('/transcribe-stream', methods=['POST'])
def transcribe_stream():
    try:
        audio_data = request.get_data()
        if len(audio_data) == 0:
            return jsonify({'error': 'No data'}), 400
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_path = temp_file.name
        
        # Convert PCM to WAV
        ffmpeg_cmd = ["ffmpeg", "-f", "s16le", "-ar", "16000", "-ac", "1", "-i", "pipe:0", "-y", temp_path]
        ffmpeg_result = subprocess.run(ffmpeg_cmd, input=audio_data, capture_output=True, timeout=10)
        
        if ffmpeg_result.returncode != 0:
            return jsonify({"error": "Audio conversion failed", "success": False}), 500
        
        try:
            cmd = [WHISPER_BIN, "-m", WHISPER_MODEL, "-f", temp_path, "--no-timestamps"]
            
            if GPU_TYPE == "cuda":
                cmd.append("-ng")
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                return jsonify({"error": f"Whisper failed", "success": False}), 500
            
            text = result.stdout.strip().replace("[BLANK_AUDIO]", "").strip()
            return jsonify({'text': text, 'language': 'auto', 'success': True}), 200
            
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
PYEOF

chmod +x "$HOME/.local/whisper-server.py"

echo ""
echo "✅ Whisper.cpp setup complete!"
echo ""
echo "📍 Installation path: $WHISPER_DIR/whisper.cpp"
echo "🖥️  GPU type: $GPU_TYPE"
echo "📦 Models downloaded: tiny, base"
echo ""
echo "🚀 To start the server:"
echo "   python3 ~/.local/whisper-server.py"
echo ""
echo "   Or run in background:"
echo "   nohup python3 ~/.local/whisper-server.py > whisper.log 2>&1 &"
echo ""
echo "🧪 Test server:"
echo "   curl http://localhost:5000/health"
echo ""
echo "📝 Systemd service template saved to: /tmp/whisper-service.txt"
echo ""
