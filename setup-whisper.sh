#!/bin/bash

# Whisper.cpp Quick Setup Script
# Run with: sudo bash setup-whisper.sh

set -e

echo "🎤 Whisper.cpp Setup for Peerzee"
echo "================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root: sudo bash setup-whisper.sh"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    apt update
    apt install -y build-essential git cmake ffmpeg
elif [ -f /etc/redhat-release ]; then
    # RedHat/CentOS
    yum groupinstall -y "Development Tools"
    yum install -y git cmake ffmpeg
elif [ "$(uname)" == "Darwin" ]; then
    # macOS
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Install from https://brew.sh"
        exit 1
    fi
    brew install cmake ffmpeg
else
    echo "⚠️  Unknown OS. Please install: build-essential, git, cmake, ffmpeg"
    read -p "Press Enter to continue or Ctrl+C to exit..."
fi

# Clone whisper.cpp
echo ""
echo "📥 Cloning whisper.cpp..."
cd /opt
if [ -d "whisper.cpp" ]; then
    echo "⚠️  whisper.cpp already exists. Updating..."
    cd whisper.cpp
    git pull
else
    git clone https://github.com/ggerganov/whisper.cpp.git
    cd whisper.cpp
fi

# Build
echo ""
echo "🔨 Building whisper.cpp..."
make clean
make -j$(nproc)

# Verify build
if [ ! -f "main" ]; then
    echo "❌ Build failed. Check errors above."
    exit 1
fi

echo "✅ Build successful!"

# Download model
echo ""
echo "📥 Downloading model..."
echo "Choose model size:"
echo "  1) tiny   (75MB)  - Fastest, lowest accuracy"
echo "  2) base   (142MB) - Balanced (RECOMMENDED)"
echo "  3) small  (466MB) - Good accuracy, slower"
echo "  4) medium (1.5GB) - Best accuracy, slowest"
echo ""
read -p "Enter choice [1-4] (default: 2): " model_choice
model_choice=${model_choice:-2}

case $model_choice in
    1) model_name="tiny" ;;
    2) model_name="base" ;;
    3) model_name="small" ;;
    4) model_name="medium" ;;
    *) 
        echo "❌ Invalid choice. Using base."
        model_name="base"
        ;;
esac

bash ./models/download-ggml-model.sh $model_name

# Verify model
if [ ! -f "models/ggml-${model_name}.bin" ]; then
    echo "❌ Model download failed."
    exit 1
fi

echo "✅ Model downloaded: ggml-${model_name}.bin"

# Test whisper
echo ""
echo "🧪 Testing whisper..."
echo "Recording 3 seconds of audio (say something)..."
sleep 1
if command -v ffmpeg &> /dev/null; then
    ffmpeg -f alsa -i default -t 3 -ar 16000 -ac 1 test.wav 2>/dev/null || \
    ffmpeg -f avfoundation -i ":0" -t 3 -ar 16000 -ac 1 test.wav 2>/dev/null || \
    echo "⚠️  Could not record audio. Skipping test."
    
    if [ -f "test.wav" ]; then
        echo "Transcribing..."
        ./main -m models/ggml-${model_name}.bin -f test.wav
        rm test.wav
    fi
fi

# Set permissions
echo ""
echo "🔐 Setting permissions..."
chmod +x main
chown -R $(logname):$(logname) /opt/whisper.cpp 2>/dev/null || echo "⚠️  Could not change owner"

# Update .env
echo ""
echo "📝 Environment variables to add to your .env:"
echo ""
echo "WHISPER_CPP_PATH=/opt/whisper.cpp/main"
echo "WHISPER_MODEL_PATH=/opt/whisper.cpp/models/ggml-${model_name}.bin"
echo ""

# Summary
echo "✨ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Add environment variables above to peerzee-backend/.env"
echo "2. Restart backend: docker compose restart backend"
echo "3. Test translation in video call"
echo ""
echo "📚 For more info, see WHISPER_SETUP.md"
