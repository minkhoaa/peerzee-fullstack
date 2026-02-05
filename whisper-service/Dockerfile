FROM nvidia/cuda:12.0.0-devel-ubuntu22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    cmake \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Clone and compile whisper.cpp with CUDA support
WORKDIR /app
RUN git clone https://github.com/ggerganov/whisper.cpp.git . && \
    cmake -B build -DGGML_CUDA=ON -DGGML_CUDA_NO_VMM=ON && \
    cmake --build build --config Release -j$(nproc)

# Download tiny model (faster, lighter)
RUN cd models && \
    bash ./download-ggml-model.sh tiny

EXPOSE 8080

# Start server with GPU optimizations
CMD ["/app/build/bin/whisper-server", "-m", "/app/models/ggml-tiny.bin", "--port", "8080", "--host", "0.0.0.0", "-t", "4"]
