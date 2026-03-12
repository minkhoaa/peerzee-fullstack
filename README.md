# Peerzee

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-Reverse%20Proxy-009639?style=for-the-badge&logo=nginx&logoColor=white)

A full-stack social discovery platform that combines real-time messaging, AI-assisted matchmaking, video dating, and community features into a single cohesive application. Peerzee uses vector similarity search (pgvector), Socket.IO websockets, a Gemini-powered Wingman agent, and an on-device Whisper speech-to-text service to deliver a modern, low-latency social experience.

---

## Features

- **AI-Powered Matching** — Vector embeddings via Google Gemini and pgvector rank compatibility scores across users. A multi-step agentic workflow orchestrates the match queue.
- **Swipe & Discover** — Tinder-style card deck with Redis-backed match state and real-time match notifications delivered over Socket.IO.
- **Real-Time Messaging** — Private and group chats with typing indicators, read receipts, file and image uploads, and voice message transcription.
- **Video Dating Room** — WebRTC signalling gateway with AI-generated conversation topics and on-the-fly translation powered by Google Translate.
- **Wingman AI Agent** — An agentic service that proactively suggests ice-breakers, reviews user bios, and schedules nudges via `@nestjs/schedule`.
- **Community Feed** — Notion-style post cards, rich media attachments, reactions, moderation, and threaded comments.
- **Gamification** — Quest engine, streak tracking, and achievement badges to drive engagement.
- **Voice Transcription** — Whisper.cpp compiled with CUDA support runs as a sidecar container and transcribes voice messages in real time.
- **Spotify Integration** — Optional music taste sync via Spotify OAuth to surface shared listening interests during profile matching.
- **Secure by Default** — JWT authentication, bcrypt password hashing, rate limiting (`@nestjs/throttler`), HTTPS termination at Nginx, and strict HSTS headers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Framer Motion, TanStack Query, Socket.IO Client |
| Backend | NestJS 11, TypeScript 5, TypeORM, MikroORM (migrations), Socket.IO, Swagger |
| Database | PostgreSQL 16 + pgvector extension |
| Cache / Queue | Redis 7 (ioredis) |
| AI / ML | Google Gemini (`@google/generative-ai`), Whisper.cpp (CUDA) |
| Media | Cloudinary (image/file uploads) |
| Proxy | Nginx (TLS termination, WebSocket upgrade, HTTP/2) |
| Infrastructure | Docker, Docker Compose (development + production profiles) |

---

## Architecture

```
Browser / Mobile
      |
   [Nginx]  ← TLS termination, HTTP/2, HSTS
   /     \
[Next.js] [NestJS API :9898]
           |        |
        [PostgreSQL  [Redis]
         + pgvector]   |
                    [Socket.IO]
                       |
                 [Whisper Sidecar :8181]
```

All services communicate over an isolated `peerzee-network` Docker bridge network. In development, the Whisper container is granted GPU access (Nvidia runtime). In production, the Whisper sidecar is omitted from the production Compose file to reduce resource requirements; transcription falls back to the hosted endpoint configured via `WHISPER_SERVICE_URL`.

---

## Services Overview

### `peerzee-frontend`

Next.js 16 application with the App Router. Key route groups:

| Route | Purpose |
|---|---|
| `/` | Landing page with feature highlights and social proof |
| `/discover` | Swipe deck powered by the match gateway |
| `/chat` | Real-time messaging interface |
| `/community` | Social feed (posts, comments, reactions) |
| `/profile/[id]` | Rich profile cards with music taste, interests, and compatibility score |
| `/match` | Match success screen and video dating room entry |
| `/settings` | Account, privacy, and notification preferences |

### `peerzee-backend`

NestJS monolith with clearly separated feature modules:

| Module | Responsibility |
|---|---|
| `user` | Profiles, preferences, Spotify sync, seeding |
| `swipe` | Like / pass logic, match creation, match gateway |
| `chat` | Message persistence, chat gateway, voice upload, transcription |
| `video-dating` | WebRTC signalling, topic generation, translation |
| `discover` | Feed ranking and vector similarity queries |
| `community` | Posts, reactions, moderation, media uploads |
| `ai` | Embedding generation and semantic search helpers |
| `wingman` | Agentic bio review, ice-breaker suggestions, scheduled nudges |
| `agents` | Multi-node LLM workflow orchestrating the match queue |
| `gamification` | Quests, streaks, and achievement tracking |
| `notification` | In-app and push notification dispatch |
| `music` | Spotify OAuth and listening history sync |

### `whisper-service`

A compiled [whisper.cpp](https://github.com/ggerganov/whisper.cpp) binary served via its built-in HTTP server. Built on `nvidia/cuda:12.0.0-devel-ubuntu22.04` with the `ggml-tiny` model. Accepts audio uploads and returns transcription JSON. Memory limits are set to 4 GB with a 2 GB reservation; GPU device passthrough is declared in the development Compose file.

### `nginx`

Reverse proxy handling:
- HTTP-to-HTTPS redirect with Let's Encrypt (`certbot`) challenge support
- TLS 1.2/1.3 with `HIGH:!aNULL:!MD5` cipher suite
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, HSTS
- WebSocket upgrade for both the Next.js HMR connection and Socket.IO (`/socket.io`)

---

## Getting Started

### Prerequisites

- Docker and Docker Compose v2
- (Optional, for GPU transcription) Nvidia Container Toolkit

### 1. Clone the repository

```bash
git clone https://github.com/minkhoaa/peerzee-fullstack.git
cd peerzee-fullstack
```

### 2. Configure environment variables

```bash
# Backend environment
cp peerzee-backend/.env.example peerzee-backend/.env
```

Edit `peerzee-backend/.env` and supply the required values:

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=peerzee
DB_PASSWORD=peerzee123
DB_DATABASE=peerzee-db

# Auth
JWT_SECRET=<strong-random-secret>

# AI Services
GEMINI_API_KEY=<your-gemini-api-key>
GOOGLE_TRANSLATE_API_KEY=<your-google-translate-api-key>

# Media
CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>

# Optional
SPOTIFY_CLIENT_ID=<spotify-client-id>
SPOTIFY_CLIENT_SECRET=<spotify-client-secret>
```

### 3. Start all services

```bash
# Development (includes Whisper sidecar with GPU support)
docker compose up --build

# Production
docker compose -f docker-compose.prod.yml up -d --build
```

Service endpoints once running:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:9898/api |
| Swagger UI | http://localhost:9898/api/docs |
| Whisper | http://localhost:8181 |

### 4. Run database migrations

```bash
docker compose exec backend npm run migration:run
```

### 5. (Optional) Seed demo data

```bash
docker compose exec backend npm run seed
```

---

## Project Structure

```
peerzee-fullstack/
├── docker-compose.yml          # Development Compose (includes Whisper + GPU)
├── docker-compose.prod.yml     # Production Compose (no Whisper sidecar)
├── nginx/
│   └── nginx.conf              # Reverse proxy, TLS, WebSocket config
├── whisper-service/
│   └── Dockerfile              # whisper.cpp CUDA build
├── peerzee-backend/            # NestJS API
│   ├── src/
│   │   ├── agents/             # LLM workflow / match orchestration
│   │   ├── ai/                 # Embedding & semantic search
│   │   ├── chat/               # Messaging, voice, gateway
│   │   ├── community/          # Feed, posts, moderation
│   │   ├── discover/           # Feed ranking
│   │   ├── gamification/       # Quests, achievements
│   │   ├── music/              # Spotify integration
│   │   ├── notification/       # Push & in-app notifications
│   │   ├── swipe/              # Match logic, gateway
│   │   ├── user/               # Profiles, auth, seeding
│   │   ├── video-dating/       # WebRTC, translation, topics
│   │   └── wingman/            # Agentic bio/icebreaker service
│   └── migrations/
└── peerzee-frontend/           # Next.js 16 App Router
    ├── app/                    # Route segments
    ├── components/             # Shared UI components
    ├── hooks/                  # Custom React hooks
    ├── lib/                    # Utilities, theme, auth helpers
    ├── services/               # API + Socket.IO client wrappers
    └── types/                  # Shared TypeScript types
```

---

## Environment Variables Reference

| Variable | Service | Description |
|---|---|---|
| `DB_HOST` | Backend | PostgreSQL hostname |
| `DB_PORT` | Backend | PostgreSQL port (default `5432`) |
| `DB_USERNAME` | Backend | Database user |
| `DB_PASSWORD` | Backend | Database password |
| `DB_DATABASE` | Backend | Database name |
| `JWT_SECRET` | Backend | Secret key for JWT signing |
| `GEMINI_API_KEY` | Backend | Google Gemini API key (embeddings + Wingman) |
| `GOOGLE_TRANSLATE_API_KEY` | Backend | Google Translate API key (video dating) |
| `WHISPER_SERVICE_URL` | Backend | Whisper HTTP endpoint (default `http://whisper:8080`) |
| `REDIS_HOST` | Backend | Redis hostname |
| `REDIS_PORT` | Backend | Redis port (default `6379`) |
| `SPOTIFY_CLIENT_ID` | Backend | Spotify OAuth client ID (optional) |
| `SPOTIFY_CLIENT_SECRET` | Backend | Spotify OAuth client secret (optional) |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | Frontend | Backend Socket.IO base URL |

---

## License

This project is private and unlicensed. All rights reserved.
