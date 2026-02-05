# Whisper Microservice

Real-time Speech-to-Text service using OpenAI Whisper.

## Features
- Fast transcription with Whisper tiny model (~200ms)
- REST API interface
- Supports multiple audio formats (wav, mp3, m4a, etc.)
- Language detection
- Health checks

## API Endpoints

### POST /transcribe
Transcribe an audio file.

**Request:**
```bash
curl -X POST http://localhost:5000/transcribe \
  -F "file=@audio.wav" \
  -F "language=en"
```

**Response:**
```json
{
  "text": "Hello, this is a test.",
  "language": "en",
  "success": true
}
```

### POST /transcribe-stream
Transcribe raw audio bytes (16kHz, mono, 16-bit).

**Request:**
```bash
curl -X POST http://localhost:5000/transcribe-stream \
  -H "Content-Type: application/octet-stream" \
  --data-binary @audio.raw
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "model": "tiny",
  "service": "whisper-transcription"
}
```

## Docker Usage

### Build
```bash
docker build -t whisper-service .
```

### Run
```bash
docker run -p 5000:5000 whisper-service
```

### Test
```bash
# Health check
curl http://localhost:5000/health

# Transcribe audio
curl -X POST http://localhost:5000/transcribe \
  -F "file=@test.wav"
```

## Model Sizes

Current: **tiny** (75MB, ~200ms)

To use other models, edit Dockerfile:
- `tiny` - 75MB, fastest
- `base` - 142MB, balanced
- `small` - 466MB, accurate
- `medium` - 1.5GB, best quality

```dockerfile
# Change this line in Dockerfile
RUN python -c "import whisper; whisper.load_model('base')"

# And this line in whisper-server.py
model = whisper.load_model("base")
```

## Performance

- **Tiny model**: ~200ms per second of audio
- **Base model**: ~500ms per second of audio
- **Memory**: ~1GB RAM for tiny model
- **CPU**: Works without GPU (recommended 4+ cores)

## Integration with Backend

See `peerzee-backend/src/video-dating/translation.service.ts`

The backend automatically calls this service when `WHISPER_SERVICE_URL` is set.
