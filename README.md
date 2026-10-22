# Nam IT TikTok Tool 🎬

> Web tool tải video và ảnh slideshow TikTok không logo (watermark-free) phát triển bởi **Nam IT**, xây dựng trên nền tảng **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, và kiến trúc **Provider Adapter Architecture**.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture & Provider Selection](#architecture--provider-selection)
- [Prerequisites](#prerequisites)
- [Local Installation & Setup](#local-installation--setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [API Endpoints Reference](#api-endpoints-reference)
- [Security & SSRF Safeguards](#security--ssrf-safeguards)
- [Deployment Guide (Vercel / Node.js)](#deployment-guide-vercel--nodejs)
- [Limitations & Rate Limits](#limitations--rate-limits)
- [Responsible Use & Disclaimer](#responsible-use--disclaimer)

---

## 🌟 Overview

**TikSave Studio** is a full-stack SaaS application that enables users to inspect and download TikTok content without intrusive watermarks. It resolves post metadata, extracts high-definition clean video variants, extracts soundtracks (MP3), and bundles photo carousel posts into clean, sequentially-named ZIP archives.

No fake data or fabricated responses are used. All metadata and media streams are resolved via real provider adapters with strict Zod schema validation and defense-in-depth security checks.

---

## ✨ Key Features

- **Genuine Watermark-Free Video Downloads**: Resolves direct high-definition (`1080p`) and standard-definition MP4 streams from TikTok CDN without watermarks.
- **Full Slideshow / Photo Carousel Support**: Detects photo posts, displays all images in their verified sequence, and allows individual photo downloads.
- **On-the-Fly ZIP Generation**: Compresses entire slideshow collections into a single, clean ZIP archive (`tiktok-photo-01.jpg`, etc.) using `JSZip` on the Node.js runtime.
- **Original Sound Extraction**: Direct download and preview of background music tracks (MP3).
- **Lightbox Preview Modal**: Full-screen photo inspection with keyboard navigation (`Esc`, `←`, `→`).
- **Interactive Input Panel**: URL paste using the Clipboard API, one-click clear, sample links, and inline real-time validation.
- **Enterprise-Grade Security**:
  - Strict domain allowlist (`tiktok.com`, `vm.tiktok.com`, `vt.tiktok.com`, `douyin.com`).
  - SSRF protection against private IP ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`, `::1`).
  - Token-bucket rate limiting on all API routes.
  - No exposure of server-side API keys or headers to the browser bundle.

---

## 🏛️ Architecture & Provider Selection

TikSave Studio utilizes a **Provider Adapter Architecture** (`src/lib/providers/`) with normalized internal types:

```
src/lib/providers/
├── types.ts              # Normalized TypeScript contracts & Zod schemas
├── tiktok-provider.ts    # Re-exports & interface definitions
├── tikwm-provider.ts     # Active default provider: TikWM API integration
├── rapidapi-provider.ts  # Alternative provider: RapidAPI TikTok Downloader
├── provider-factory.ts   # Instantiates provider based on environment
└── selected-provider.ts  # Singleton accessor for active provider
```

### Selected Active Provider: TikWM API
- **Official Documentation**: [https://www.tikwm.com/](https://www.tikwm.com/)
- **Endpoint**: `https://www.tikwm.com/api/?url={URL}&hd=1`
- **Supported Media**:
  - `play`: Standard watermark-free MP4
  - `hdplay`: High-definition watermark-free MP4
  - `wmplay`: Watermarked original MP4
  - `images`: Array of raw high-resolution JPEG images (for carousels)
  - `music`: Original audio track
- **Pricing & Access**: Free public endpoint out-of-the-box, with optional RapidAPI key support for higher concurrency limits.

---

## 📋 Prerequisites

- **Node.js**: `v18.18.0` or higher (Recommended: `v20.x` or `v24.x`)
- **Package Manager**: `npm` (v9+), `pnpm`, or `yarn`

---

## 🚀 Local Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ToolVideoTikTok
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```

---

## ⚙️ Environment Configuration

Edit `.env.local` to configure your selected provider:

```ini
# Provider selector: 'tikwm' (default) or 'rapidapi'
TIKTOK_PROVIDER_TYPE=tikwm

# Base URL for the provider API
TIKTOK_PROVIDER_BASE_URL=https://www.tikwm.com/api/

# Optional: If TIKTOK_PROVIDER_TYPE=rapidapi
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com

# Timeout for upstream provider requests (in milliseconds)
TIKTOK_TIMEOUT_MS=15000

# Port for local development (default: 3000)
PORT=3000
```

> [!NOTE]
> No paid API key is required for default functionality. The built-in TikWM provider works immediately for all public TikTok video and slideshow links.

---

## 💻 Running the Application

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

---

## 🧪 Testing & Quality Assurance

TikSave Studio includes automated unit and integration tests powered by **Vitest**:

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run ESLint linter
npm run lint

# Run TypeScript typecheck
npx tsc --noEmit
```

### Test Coverage Highlights:
- **URL Validation & Normalization**: Standard desktop links, short links (`vm.tiktok.com`, `vt.tiktok.com`), protocol enforcement, query stripping.
- **SSRF Defense**: Rejection of `127.0.0.1`, `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`, `169.254.169.254`, IPv6 loopbacks, and untrusted hostnames.
- **Provider Normalization**: Watermark variant selection, slideshow photo sorting, audio extraction, error code translation.
- **ZIP Packaging**: Real in-memory compression and unpacking with filename preservation.
- **Route Handlers**: API health status validation ensuring zero secret leaks.

---

## 📡 API Endpoints Reference

### 1. `POST /api/resolve`
Resolves and extracts metadata from a TikTok URL.

**Request Body**:
```json
{
  "url": "https://www.tiktok.com/@tiktok/video/7106594312292453675"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "id": "7106594312292453675",
    "contentType": "video",
    "title": "Example Video",
    "thumbnailUrl": "https://...",
    "videoVariants": [
      {
        "id": "no_watermark_hd",
        "qualityLabel": "HD (1080p) - No Watermark",
        "hasWatermark": false,
        "downloadUrl": "https://..."
      }
    ],
    "photos": [],
    "providerName": "TikWM Media Provider"
  }
}
```

### 2. `POST /api/download`
Streams media securely through the backend with safe `Content-Disposition` and `Content-Type` headers.

**Request Body**:
```json
{
  "url": "https://v16-notes.tiktokcdn-us.com/...",
  "filename": "my-video.mp4",
  "contentType": "video/mp4"
}
```

### 3. `POST /api/download-zip`
Packages slideshow photos into an orderly ZIP archive.

**Request Body**:
```json
{
  "items": [
    { "url": "https://p16-sign.tiktokcdn-us.com/...", "filename": "photo-01.jpg" },
    { "url": "https://p16-sign.tiktokcdn-us.com/...", "filename": "photo-02.jpg" }
  ],
  "zipFilename": "slideshow.zip"
}
```

### 4. `GET /api/health`
Returns system status, active provider name, and connectivity verification without revealing secrets.

---

## 🛡️ Security & SSRF Safeguards

- **Domain Allowlisting**: Only verified TikTok domains (`tiktok.com`, `vt.tiktok.com`, `vm.tiktok.com`, `douyin.com`) are resolved.
- **SSRF Prevention**: All media download URLs are checked against private IP networks and restricted to documented TikTok CDN hostnames (`*.tiktokcdn.com`, `*.tiktokcdn-us.com`, `*.tokcdn.com`, etc.).
- **Rate Limiting**: Built-in sliding-window token bucket prevents API abuse.
- **Memory Caps**: ZIP generation is capped at a maximum of 50 items and 150 MB total buffer size to prevent memory exhaustion in serverless runtimes.

---

## 🌐 Deployment Guide (Vercel / Node.js)

### Vercel Deployment
1. Import the repository into your Vercel Dashboard.
2. In the project settings, ensure the **Framework Preset** is set to `Next.js`.
3. Add the environment variables:
   - `TIKTOK_PROVIDER_TYPE=tikwm`
   - `TIKTOK_PROVIDER_BASE_URL=https://www.tikwm.com/api/`
4. Deploy! All API route handlers run on the **Node.js runtime** (`export const runtime = 'nodejs';`), ensuring full compatibility with buffer manipulation and `JSZip`.

> [!WARNING]
> Do not use Edge Runtime for `/api/download-zip` because ZIP generation requires Node.js `Buffer` and streaming primitives.

---

## ⚠️ Limitations & Rate Limits

- **Private Posts**: Videos or photos from private TikTok accounts cannot be resolved due to TikTok privacy boundaries.
- **Expired Links**: TikTok CDN media URLs contain temporary security tokens that expire after several hours. Always download promptly after resolving.
- **Provider Outages**: If the upstream provider experiences downtime, the UI displays an actionable error message allowing the user to retry.

---

## ⚖️ Responsible Use & Disclaimer

TikSave Studio is intended solely for personal, educational, and fair-use archiving purposes. TikTok and Douyin are registered trademarks of ByteDance Ltd. TikSave Studio is an independent open-source tool and is not affiliated with, endorsed by, or sponsored by TikTok or ByteDance. Users are strictly responsible for complying with copyright laws and obtaining permission from content creators before downloading or redistributing any media.
