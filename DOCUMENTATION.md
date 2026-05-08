# FluenzyAI — Comprehensive Production-Ready Documentation

> **Version:** 0.1.0 | **Stack:** Next.js 15, FastAPI, MongoDB (Prisma ORM), Cloudflare R2, Razorpay, Agora RTC, Google Gemini AI, Socket.IO, TailwindCSS 4

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Repository Structure](#4-repository-structure)
5. [Environment Variables](#5-environment-variables)
6. [Local Development Setup](#6-local-development-setup)
7. [Production Deployment](#7-production-deployment)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Role-Based Access Control (RBAC)](#9-role-based-access-control-rbac)
10. [Database Schema Reference](#10-database-schema-reference)
11. [API Reference](#11-api-reference)
12. [Core Training Modules](#12-core-training-modules)
13. [AI / ML Integration](#13-ai--ml-integration)
14. [Real-Time Features](#14-real-time-features)
15. [Group Discussion (GD) System](#15-group-discussion-gd-system)
16. [ATS (Resume Scoring) System](#16-ats-resume-scoring-system)
17. [HR & Admin Portal System](#17-hr--admin-portal-system)
18. [College Admin System](#18-college-admin-system)
19. [Company Portal & External Jobs](#19-company-portal--external-jobs)
20. [Marketing & Email Automation](#20-marketing--email-automation)
21. [Billing & Subscription System](#21-billing--subscription-system)
22. [File Storage — Cloudflare R2](#22-file-storage--cloudflare-r2)
23. [End-to-End Encrypted Chat System](#23-end-to-end-encrypted-chat-system)
24. [Python Backend Service (YOLOv8 + MediaPipe)](#24-python-backend-service-yolov8--mediapipe)
25. [Progressive Web App (PWA)](#25-progressive-web-app-pwa)
26. [Super Admin Panel](#26-super-admin-panel)
27. [Security Architecture](#27-security-architecture)
28. [Cron Jobs & Automation](#28-cron-jobs--automation)
29. [Certificate Management](#29-certificate-management)
30. [Troubleshooting & FAQ](#30-troubleshooting--faq)

---

## 1. Project Overview

**FluenzyAI** is a full-stack, AI-powered career accelerator platform built for job seekers, students, college institutions, and hiring companies. It combines several independent, deeply integrated subsystems:

| Subsystem | Purpose |
|-----------|---------|
| **AI Interview Coach** | Live voice-based interview sessions scored by Google Gemini AI |
| **English Learning Engine** | Daily spoken-English conversations and lessons |
| **Group Discussion (GD)** | Multi-user Agora RTC sessions with AI co-participants and behavioral analytics |
| **Interview Guide** | AI-generated personalized study plan per role/company/JD |
| **ATS Resume Analyzer** | Resume scoring with keyword gap analysis against job descriptions |
| **HR Portal** | Full HRMS — employees, attendance, payroll, leave, candidates, offer letters |
| **College Admin** | Bulk student management, batch allocation, plan management, competitions |
| **Company Portal** | External job posting, candidate pipeline, AI assessments, auto-apply |
| **Marketing Platform** | Email campaign builder, audience segmentation, behavioral automation |
| **E2E Chat** | NaCl box encrypted direct and group messaging with Socket.IO delivery |
| **Python Vision Backend** | YOLOv8 + MediaPipe real-time proctoring via WebSocket frames |

The platform is live at **[https://www.fluenzyai.app](https://www.fluenzyai.app)**.

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            CLIENT (Browser / PWA)                         │
│  React 19 · Next.js 15 App Router · TailwindCSS 4 · Framer Motion        │
│  Agora RTC SDK · Socket.IO-client · NaCl (TweetNaCl) encryption          │
└──────────────────────┬───────────────────────────────────────────────────┘
                       │ HTTPS / WSS
┌──────────────────────▼───────────────────────────────────────────────────┐
│                          NODE.JS SERVER  (server.js)                       │
│  Next.js 15 custom server · Socket.IO  (path: /api/socket/io)             │
│  Port 3000 (prod) / 3000 (dev)                                             │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │              NEXT.JS APP ROUTER API ROUTES (/api/*)                  │  │
│  │  Auth · Sessions · Billing · GD · Chat · ATS · Jobs · Portal · ...  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────┬─────────────────────────────────────┬────────────────────────┘
            │ Prisma ORM                           │ HTTP
  ┌─────────▼──────────┐               ┌──────────▼──────────┐
  │  MongoDB Atlas      │               │  Python FastAPI      │
  │  (DocumentDB)       │               │  (port 8000)         │
  │  ~50 collections    │               │  YOLOv8 · MediaPipe  │
  └────────────────────┘               └─────────────────────┘
            │
  ┌─────────▼──────────┐
  │  External Services  │
  │  • Google Gemini AI │
  │  • Agora RTC        │
  │  • Cloudflare R2    │
  │  • Razorpay         │
  │  • Brevo / Nodemailer│
  │  • ImageKit CDN     │
  └────────────────────┘
```

**Key design decisions:**
- The Next.js app uses a **custom HTTP server** (`server.js`) to co-host Socket.IO on the same port, avoiding CORS issues.
- All MongoDB IDs are `@db.ObjectId` (24-char hex), mapped from Prisma's BSON `auto()`.
- File storage uses **Cloudflare R2** (S3-compatible) with a public CDN domain (`cdn.fluenzyai.app`). Private files get signed URLs (5-min TTL); public files get lifetime CDN URLs.
- Chat messages are encrypted **client-side** with NaCl secretbox before leaving the browser. Secret keys are stored in IndexedDB and **never** transmitted to the server.

---

## 3. Technology Stack

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^15.5.9 | Full-stack React framework, App Router |
| `react` / `react-dom` | 19.1.0 | UI library |
| `tailwindcss` | ^4.0.0 | Utility-first CSS |
| `framer-motion` | ^12.23.12 | Animations and transitions |
| `@radix-ui/*` | various | Accessible headless UI primitives (30+ components) |
| `lucide-react` | ^0.542.0 | Icon library |
| `react-hook-form` | ^7.71.1 | Form state management |
| `zod` | ^4.3.6 | Schema validation |
| `agora-rtc-sdk-ng` | ^4.24.2 | WebRTC audio/video for GD rooms |
| `socket.io-client` | ^4.8.3 | Real-time WebSocket client |
| `tweetnacl` + `tweetnacl-util` | ^1.0.3 / ^0.15.1 | NaCl box E2E encryption |
| `recharts` | ^2.15.4 | Analytics charts |
| `sonner` | ^2.0.7 | Toast notifications |
| `next-themes` | ^0.4.6 | Dark/light/system theme |

### Backend (Node.js)
| Package | Version | Purpose |
|---------|---------|---------|
| `@prisma/client` | ^6.19.0 | MongoDB ORM |
| `next-auth` | ^4.24.11 | Authentication (Google OAuth + Credentials) |
| `bcryptjs` | ^3.0.3 | Password hashing |
| `jsonwebtoken` | ^9.0.3 | JWT token generation (Portal auth) |
| `@google/generative-ai` + `@google/genai` | ^0.24.1 / ^1.35.0 | Gemini AI SDK |
| `@aws-sdk/client-s3` | ^3.1019.0 | Cloudflare R2 via S3 API |
| `socket.io` | ^4.8.3 | WebSocket server for GD matchmaking |
| `agora-token` | ^2.0.5 | Agora RTC token generation |
| `razorpay` | ^2.9.4 | Payment gateway SDK |
| `@getbrevo/brevo` | ^5.0.3 | Transactional email (Brevo) |
| `nodemailer` | ^7.0.13 | Email fallback / SMTP |
| `pdf-parse` + `mammoth` | ^2.4.5 / ^1.11.0 | PDF/DOCX text extraction for ATS |
| `puppeteer-core` + `@sparticuz/chromium` | ^24.37.5 / ^143.0.4 | Headless browser PDF generation |
| `express-rate-limit` | ^8.2.1 | API rate limiting |
| `libsodium-wrappers` | ^0.8.2 | Server-side key management for E2E chat |
| `qrcode` | ^1.5.4 | Certificate QR code generation |

### Python Backend
| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | 0.109.0 | Async REST + WebSocket API |
| `uvicorn` | 0.27.0 | ASGI server |
| `ultralytics` | 8.1.0 | YOLOv8 object detection |
| `mediapipe` | 0.10.9 | Face mesh, pose, hand landmark detection |
| `opencv-python-headless` | 4.9.0.80 | Frame processing (no GUI) |
| `torch` / `torchvision` | 2.2.2 / 0.17.2 | CPU-only PyTorch |
| `numpy` / `scipy` / `pandas` | 1.26.4 / 1.12.0 / 2.2.0 | Numeric processing |

### Infrastructure & External Services
| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Primary database |
| Cloudflare R2 + CDN | Object storage (resumes, certificates, PDFs) |
| Agora RTC | WebRTC audio/video for GD and interview rooms |
| Google Gemini 1.5 Flash / Pro | AI interview evaluation, content generation |
| Razorpay | Indian payment gateway (subscriptions, one-time payments) |
| Brevo (formerly Sendinblue) | Transactional + marketing email delivery |
| Google Analytics (GA4) | User analytics |
| ImageKit | Profile image CDN |

---

## 4. Repository Structure

```
Fluenzy-AI/
├── backend/                        # Python FastAPI microservice
│   ├── main.py                     # FastAPI app, WebSocket handler, YOLOv8 inference
│   ├── behavioral_analysis.py      # MediaPipe-based behavioral scoring
│   ├── models/                     # ML model files
│   ├── requirements.txt
│   ├── setup_venv.py               # Automated venv + pip install script
│   ├── render.yaml                 # Render.com deployment config
│   └── runtime.txt                 # Python version pin
│
├── prisma/
│   └── schema.prisma               # Full Prisma schema (MongoDB, ~50 models)
│
├── public/                         # Static assets, PWA manifest, favicons
│
├── scripts/
│   └── start-backend.js            # Cross-platform backend launcher
│
├── src/
│   ├── app/                        # Next.js App Router pages & API routes
│   │   ├── layout.tsx              # Root layout (meta, scripts, providers)
│   │   ├── page.tsx                # Landing page
│   │   ├── providers.tsx           # NextAuth SessionProvider
│   │   │
│   │   ├── api/                    # All API route handlers
│   │   │   ├── auth/               # NextAuth, OTP, password reset
│   │   │   ├── ai/                 # Gemini proxies, interview generation
│   │   │   ├── evaluate-answer/    # Answer scoring with Gemini
│   │   │   ├── session-start/      # Module session guard
│   │   │   ├── gd/                 # Group Discussion APIs
│   │   │   ├── ats/                # ATS resume analysis
│   │   │   ├── billing/            # Razorpay, webhook, coupons
│   │   │   ├── portal/             # HR Portal REST API
│   │   │   ├── company/            # Company Portal API
│   │   │   ├── college/            # College Admin API
│   │   │   ├── chat/               # E2E chat, encryption keys
│   │   │   ├── jobs/               # Internal & external job listings
│   │   │   ├── admin/              # Super admin + marketing APIs
│   │   │   ├── analytics/          # Usage, behavioral analytics
│   │   │   ├── cron/               # Scheduled job endpoints
│   │   │   └── ...                 # 40+ additional route groups
│   │   │
│   │   ├── train/                  # Training module pages
│   │   ├── history/                # Session history
│   │   ├── ats/                    # ATS dashboard
│   │   ├── billing/                # Billing page
│   │   ├── profile/                # User profile
│   │   ├── superadmin/             # Super admin dashboard
│   │   ├── portal/                 # HR portal
│   │   ├── hirelens/               # Company hiring portal
│   │   ├── college/                # College admin panel
│   │   └── ...                     # Landing, blog, careers, legal pages
│   │
│   ├── components/                 # Reusable React components
│   │   ├── ui/                     # shadcn/ui primitives
│   │   ├── navbar/                 # Site navigation
│   │   ├── dashboard/              # User dashboard widgets
│   │   ├── train/                  # Training UI components
│   │   ├── chat/                   # Chat components
│   │   ├── modals/                 # Global modal components
│   │   └── ...
│   │
│   ├── lib/                        # Server utilities & service wrappers
│   │   ├── auth.ts                 # NextAuth configuration
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── gemini.ts               # Gemini AI SDK wrapper
│   │   ├── billing.ts              # Razorpay subscription logic
│   │   ├── r2-service.ts           # Cloudflare R2 operations
│   │   ├── r2.ts                   # R2 client configuration
│   │   ├── cdn.ts                  # CDN URL builder
│   │   ├── ats-engine.ts           # ATS PDF/DOCX parser
│   │   ├── gdMatchmaking.ts        # GD session/topic logic
│   │   ├── socketServer.ts         # Socket.IO server (dev mode)
│   │   ├── socketClient.ts         # Socket.IO client hooks
│   │   ├── encryption-client.ts    # Client-side NaCl E2E encryption
│   │   ├── brevo-mail.ts           # Brevo transactional email
│   │   ├── email-templates.ts      # HTML email templates
│   │   ├── agoraToken.ts           # Agora RTC token generation
│   │   ├── serverAccessCheck.ts    # Module usage limit enforcement
│   │   ├── candidate-auth.ts       # Candidate portal JWT auth
│   │   ├── company-auth.ts         # Company portal JWT auth
│   │   ├── portal-auth.ts          # HR portal JWT auth
│   │   ├── collegeAuth.ts          # College admin JWT auth
│   │   ├── marketing-auth.ts       # Marketing admin JWT auth
│   │   └── ...                     # ~30 additional utilities
│   │
│   ├── contexts/                   # React context providers
│   │   ├── ThemeContext.tsx
│   │   ├── PortalAuthContext.tsx
│   │   ├── CollegeAdminContext.tsx
│   │   └── CompanyAuthContext.tsx
│   │
│   ├── hooks/                      # Custom React hooks
│   ├── modules/                    # Landing page section components
│   └── types/                      # TypeScript type definitions
│
├── server.js                       # Custom Node.js server (Next.js + Socket.IO)
├── next.config.ts                  # Next.js configuration
├── package.json
├── tsconfig.json
├── postcss.config.mjs
└── components.json                 # shadcn/ui config
```

---

## 5. Environment Variables

Create a `.env.local` file in the project root. **Never commit this file.**

### Authentication
```env
NEXTAUTH_URL=https://www.fluenzyai.app       # Full URL for NextAuth callbacks
NEXTAUTH_SECRET=<32+ random bytes>            # JWT signing secret

GOOGLE_CLIENT_ID=<your Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<your Google OAuth client secret>
```

### Database
```env
DATABASE_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/fluenzy?retryWrites=true&w=majority
```

### AI / Gemini
```env
GEMINI_API_KEY=<Google AI Studio API key>
```

### File Storage — Cloudflare R2
```env
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<R2 access key>
R2_SECRET_ACCESS_KEY=<R2 secret key>
R2_BUCKET_NAME=fluenzy-files
R2_PUBLIC_URL=https://cdn.fluenzyai.app      # Your custom CDN domain
```

### Agora RTC (Group Discussion & Interview Rooms)
```env
NEXT_PUBLIC_AGORA_APP_ID=<Agora App ID>
AGORA_APP_CERTIFICATE=<Agora App Certificate>
```

### Payment — Razorpay
```env
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=<secret>
RAZORPAY_WEBHOOK_SECRET=<webhook signing secret>
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...     # Exposed to browser for checkout.js
```

### Email — Brevo (Transactional)
```env
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=noreply@fluenzyai.app
BREVO_SENDER_NAME=FluenzyAI
```

### Email — SMTP Fallback (Nodemailer)
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=<password>
```

### Python Backend
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000  # Dev
# For production, replace with your deployed backend URL
```

### Portal JWT Secrets (separate from NextAuth)
```env
PORTAL_JWT_SECRET=<secret for HR portal JWTs>
CANDIDATE_JWT_SECRET=<secret for candidate portal JWTs>
COMPANY_JWT_SECRET=<secret for company portal JWTs>
COLLEGE_JWT_SECRET=<secret for college admin JWTs>
MARKETING_JWT_SECRET=<secret for marketing admin JWTs>
```

### ImageKit (optional — profile images)
```env
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_PRIVATE_KEY=private_...
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/...
```

### Cron Security
```env
CRON_SECRET=<random secret to protect cron endpoints>
```

---

## 6. Local Development Setup

### Prerequisites
- Node.js ≥ 20.x
- Python 3.10–3.11 (for backend)
- MongoDB Atlas connection string (or local MongoDB)

### Step 1 — Install Node dependencies
```bash
npm install
```

### Step 2 — Configure environment
```bash
cp .env.example .env.local  # fill in all values from §5
```

### Step 3 — Set up the database
```bash
npx prisma generate          # generates Prisma client from schema
npx prisma db push           # syncs schema to MongoDB (creates indexes)
```

### Step 4 — Set up the Python backend (optional — needed for video analysis)
```bash
npm run backend:setup        # creates venv and installs requirements.txt
```

### Step 5 — Start development

**Option A — Frontend only:**
```bash
npm run dev                  # starts Next.js on http://localhost:3000
```

**Option B — Full stack (frontend + Python backend concurrently):**
```bash
npm run dev:full
# Runs: "npm run backend" + "npm run dev" via concurrently
# Outputs are color-coded: cyan = backend, green = frontend
```

**Starting backend separately:**
```bash
# Unix/macOS
npm run backend:start:unix

# Windows
npm run backend:start:win
```

### Step 6 — Seed the database (optional)
```bash
# Create a SUPER_ADMIN user manually:
npx ts-node scripts/create-super-admin.ts
```

---

## 7. Production Deployment

### Build
```bash
npm run build
# Runs: npx prisma generate && next build
```

### Start production server
```bash
npm start
# Runs: node server.js
# server.js boots Next.js + Socket.IO together on process.env.PORT (default 3000)
```

### Python backend deployment (Render.com)
The `backend/render.yaml` is preconfigured for Render.com free/starter tier:
```yaml
# Sets PYTHON_VERSION, installs requirements, starts uvicorn
```
Deploy by connecting your GitHub repo to Render and selecting the `/backend` directory.

### Key production configuration

| Setting | Value / Note |
|---------|--------------|
| Node version | ≥ 20.x (enforced in `package.json` engines) |
| Port | `process.env.PORT` (Render, Railway, etc. inject this automatically) |
| `NODE_ENV` | Must be `production` for Next.js to disable hot-reload |
| `NEXTAUTH_URL` | Must match the exact deployed URL (including protocol) |
| Service Worker | `public/sw.js` — cached with `no-store` headers (see `next.config.ts`) |
| PWA Manifest | `public/manifest.json` — served with `application/manifest+json` |
| Resume PDFs | Served with CORS headers to allow PDF.js embedding |

### Health checks
- Next.js: `GET /` → 200 OK
- Python: `GET http://backend:8000/health` → `{"status":"ok"}`

---

## 8. Authentication & Authorization

FluenzyAI has **six independent auth systems** sharing the MongoDB database but using different tokens:

| System | Provider | Token Type | Scope |
|--------|----------|------------|-------|
| **Main app** | NextAuth.js (Google OAuth + Credentials) | JWT (HttpOnly cookie) | All main-app users |
| **HR Portal** | Custom JWT | Bearer token (localStorage) | `PortalStaff` (ADMIN, HR) |
| **College Admin** | Custom JWT | Bearer token | `CollegeAdmin` |
| **Company Portal** | Custom JWT | Bearer token | `CompanyMember` |
| **Candidate Portal** | Custom JWT | Bearer token | `CandidateUser` |
| **Marketing Admin** | Custom JWT | Bearer token | `MarketingAdmin` |

### Main App Authentication Flow

```
1. User visits /login or clicks "Sign in with Google"
2a. Google OAuth:
    - NextAuth redirects to Google consent screen
    - Google redirects back with authorization code
    - NextAuth exchanges code for user profile
    - `common()` in auth.ts creates a users record if new
    - JWT cookie set with { id, email, plan, usageCount, role }
2b. Credentials (email/password):
    - OTP is sent to email first (via /api/auth/send-otp)
    - User verifies OTP (via /api/auth/verify-otp)
    - On success, password hash compared with bcrypt
    - JWT cookie set (same fields as above)
3. Every request to protected routes goes through middleware.ts
4. JWT callback ALWAYS fetches fresh user from DB to prevent stale plan data
```

### OTP Flow (Signup & Password Reset)
```
POST /api/auth/send-otp     → creates OtpVerification record (6-digit, 10 min TTL)
POST /api/auth/verify-otp   → verifies OTP, marks verified=true
POST /api/auth/resend-otp   → resends with attempt tracking (max 3)
POST /api/auth/reset-password → sets new password after OTP verified
```

### Portal JWT Auth (HR / College / Company / Candidate / Marketing)
Each portal has its own `lib/*-auth.ts` file that:
1. Signs JWTs with its own secret (`PORTAL_JWT_SECRET`, `COLLEGE_JWT_SECRET`, etc.)
2. Provides `verifyPortalToken(req)` to authenticate API routes
3. Issues refresh tokens stored in `PortalRefreshToken` (HR portal)

---

## 9. Role-Based Access Control (RBAC)

### Main App Roles (`enum Role`)
| Role | Privileges |
|------|-----------|
| `User` | Access training modules (subject to plan limits), profile, history |
| `Admin` | Manage content, view all users (not currently active) |
| `Modaretor` | Moderation (not currently active) |
| `SUPER_ADMIN` | Full access — `/superadmin/*`, all admin APIs, create coupons, manage plans, send email blasts |
| `COLLEGE_ADMIN` | Managed separately via `CollegeAdmin` model + JWT auth |
| `PORTAL_ADMIN` | HR Portal admin via `PortalStaff` model |
| `PORTAL_HR` | HR Portal HR staff via `PortalStaff` model |
| `MARKETING_ADMIN` | Marketing platform via `MarketingAdmin` model |

### Plan-Based Access (`enum Plan`)
| Plan | Default Session Limits (per module per month) |
|------|----------------------------------------------|
| `Free` | english: 2, hr: 2, gd: 2, technical: 2, company: 2, mock: 2, daily: 2, interviewGuide: 1 |
| `Standard` | Configurable via `PlanPricing.moduleLimits` in DB |
| `Pro` | Unlimited (isUnlimited: true) |
| `Enterprise` | Unlimited + custom college/company configuration |

Module limits are stored in `PlanPricing.moduleLimits` (JSON) and enforced server-side in `src/lib/serverAccessCheck.ts` before every AI session starts.

### Middleware Protection (`src/middleware.ts`)
```
Protected routes:
  /pro/*                    → requires plan === "Pro"
  /api/pro/*                → requires plan === "Pro"
  /superadmin/*             → requires role === "SUPER_ADMIN"
  /api/admin/*              → requires role === "SUPER_ADMIN" (except /api/admin/marketing)
  /train/*                  → requires valid NextAuth JWT
  /history/*                → requires valid NextAuth JWT
  /profile/*                → requires valid NextAuth JWT
  /billing/*                → requires valid NextAuth JWT
  /ats/*                    → requires valid NextAuth JWT
  /api/ats/*                → requires valid NextAuth JWT
  /api/evaluate-answer/*    → requires valid NextAuth JWT
  /api/gd/*                 → requires valid NextAuth JWT
  /api/interview-guide/*    → requires valid NextAuth JWT
  /api/lesson-complete/*    → requires valid NextAuth JWT
  /api/daily-complete/*     → requires valid NextAuth JWT
  /api/check-module-access/*→ requires valid NextAuth JWT
```

---

## 10. Database Schema Reference

FluenzyAI uses **MongoDB** with **Prisma ORM**. Below is a summary of every model, grouped by subsystem.

### Core User System
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Main application users | `email`, `plan`, `role`, `usageCount`, `usageLimit`, module usage counters (8), `storageUsed`, `disabled` |
| `UserProfile` | Extended public profile | `username`, `headline`, `bio`, `socialLinks`, `openToWork`, `publicProfileEnabled`, `publicSections` |
| `Skill` | Skills in user profile | `name`, `level` |
| `Experience` | Work experience | `role`, `company`, `startDate`, `endDate` |
| `Education` | Educational background | `degree`, `institution`, `startYear`, `endYear`, `grade` |
| `Certification` | Certifications | `name`, `issuer`, `issueDate`, `credentialUrl`, `skills[]` |
| `Project` | User projects | `title`, `techStack`, `projectUrl`, `repoUrl` |
| `Course` | Online courses | `name`, `platform`, `status` |
| `Language` | Language proficiency | `name`, `proficiency` |
| `OtpVerification` | OTP for signup/2FA | `email`, `otp`, `type`, `attempts`, `expiresAt`, `pendingName`, `pendingPassword` |
| `UserLoginLog` | Login audit trail | `loginTime`, `ip`, `location`, `deviceType`, `os`, `browser`, `status` |

### Session & Training
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Session` | Completed training session | `module`, `targetCompany`, `role`, `aggregateScore`, `status` |
| `Transcript` | Per-question turn in session | `aiPrompt`, `userAnswer`, `aiFeedback`, `idealAnswer`, all 5 score dimensions |
| `ActiveSession` | In-progress session guard | `sessionToken`, `module`, `status` (prevents refresh abuse) |
| `LessonProgress` | English lesson progress | `lessonId`, `isCompleted`, `completedAt`, `score` |
| `HRProgress` | HR lesson progress | same structure |
| `GDProgress` | GD lesson progress | same structure |
| `MonthlyUsage` | Per-billing-cycle usage tracker | 9 module usage counters, `billingCycleStart`, `billingCycleEnd` |
| `InterviewGuide` | AI-generated study guide | `targetRole`, `targetCompany`, `experienceLevel`, `communicationLevel`, `jobDescription`, `generatedContent` (JSON) |

### Billing
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `subscriptions` | Active Razorpay subscription | `stripeSubscriptionId` (Razorpay ID), `plan`, `status`, `currentPeriodEnd`, `autoRenew` |
| `PaymentHistory` | All payment transactions | `paymentId`, `orderId`, `plan`, `finalAmount`, `status`, `couponUsed` |
| `Receipt` | Tax receipt / invoice | `invoiceNumber`, `originalAmount`, `discountAmount`, `finalAmount`, `receiptUrl` |
| `PlanPricing` | Dynamic plan configuration | `plan`, `price`, `annualPrice`, `moduleLimits` (JSON), `isUnlimited`, `razorpayPlanId` |
| `GlobalPlanSettings` | Plan enable/disable toggle | `monthlyLimit`, `isUnlimited`, `status` |
| `Coupon` | Discount coupon | `code`, `discountType`, `discountValue`, `maxUsage`, `applicablePlans[]`, `expiryDate` |
| `CouponUsage` | Coupon redemption log | `couponId`, `userId`, `originalPrice`, `discountAmount`, `finalPrice` |
| `RazorpayWebhookEvent` | Webhook audit trail | `eventType`, `webhookId`, `payload` (raw JSON), `processed` |

### Group Discussion (GD)
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `GDQueue` | Matchmaking waiting queue | `userId`, `participantCount`, `difficulty`, `mode`, `status` |
| `GDSession` | Active or completed GD session | `channelName` (Agora), `topic`, `phase`, `duration`, `maxDuration` (1200s) |
| `GDParticipant` | User's role in a GD session | `role` (GDRole enum), `order`, `status` |
| `GDAnalytics` | Per-session/participant metrics | `speakingTime`, `interruptions`, `confidenceScore`, `paceScore`, `fillerWordCount`, `rolePerformanceScore` |
| `GDTranscript` | Real-time GD transcript | `speakerName`, `role`, `content`, `timestamp`, `phase` |
| `GDHistory` | Post-session history record | 7 score dimensions, `strengths[]`, `improvements[]`, `transcriptUrl` |
| `GDTopic` | Pre-loaded topic bank | `content`, `category`, `difficulty`, `usageCount` |
| `LatestTopic` | Company-specific recent topics | `companyName`, GD/PI/Technical topic+question+difficulty triples |

### ATS System
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `ATSResume` | Uploaded resume | `fileUrl`, `fileType`, `rawText`, `parsedData` (JSON) |
| `ATSAnalysis` | AI scoring result | `atsScore`, 6 sub-scores, `matchedKeywords[]`, `missingKeywords[]`, `suggestions[]`, `strengths[]` |
| `ATSRanking` | Leaderboard rank | `rank`, `totalScore`, `college`, `jobRole` |
| `Resume` | General resume upload | `fileName`, `fileUrl` |
| `FileRecord` | R2 file metadata | `fileType`, `fileKey`, `originalFileName`, `fileSize`, `mimeType`, `isPublic`, `isDeleted` |

### College Admin System
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `CollegeAdmin` | College institution account | `collegeName`, `domain`, `status`, `totalSeats`, `usedSeats`, `allocatedPlan`, `moduleLimits` |
| `CollegeStudent` | Student record | `email`, `rollNumber`, `batchId`, `status`, `inviteToken`, `tempPassword` |
| `CollegeBatch` | Student batch/cohort | `name`, `department`, `graduationYear`, `studentCount` |
| `CollegePaymentHistory` | College payment log | `plan`, `seats`, `amount`, `validFrom`, `validTill` |
| `CollegeTransaction` | Razorpay order for college | `razorpayOrderId`, `plan`, `seats`, `pricePerSeat`, `finalAmount`, `studentEmails[]` |
| `CollegeCoupon` | College-specific coupons | `code`, `discountType`, `discountValue`, `minSeats` |
| `CollegeOtpVerification` | OTP for college signup | same structure as `OtpVerification` |
| `Competition` | College-hosted competitions | linked to `CollegeAdmin` |

### HR & Admin Portal
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `PortalStaff` | HR/Admin portal accounts | `email`, `role` (ADMIN/HR/MARKETING_ADMIN), `status`, `permissions` (JSON), `loginAttempts`, `lockedUntil` |
| `Employee` | Internal employee records | `employeeCode`, `department`, `designation`, `salary`, `status` |
| `Candidate` | HR candidate pipeline | `name`, `position`, `status` (9-stage pipeline), `resumeUrl`, `skills[]`, `source` |
| `Interview` | Scheduled interviews | `type` (VIDEO/PHONE/IN_PERSON), `scheduledAt`, `meetingLink`, `result` |
| `OfferLetter` | Generated offer letters | `position`, `salary`, `joiningDate`, `content` (HTML), `pdfUrl`, `status` |
| `LeaveRequest` | Employee leave management | `type` (6 types), `startDate`, `endDate`, `status`, `approvedBy` |
| `Attendance` | Daily attendance | `checkIn`, `checkOut`, `hoursWorked`, `status` |
| `PayrollRecord` | Monthly payroll | `basicSalary`, `allowances`, `deductions`, `netSalary`, `status` |
| `Certificate` | HR-issued certificates | `type` (6 types), `data` (JSON), `pdfUrl`, `qrCodeDataUrl`, `status` |
| `CertificateTemplate` | Reusable HTML templates | `contentHtml`, `variables` (JSON), `styles` (JSON), `isDefault` |
| `CertificateVerification` | Public verification log | `certificateId`, `verifiedAt`, `ipAddress` |
| `SupportTicket` | User support tickets | `ticketNumber`, `title`, `status`, `priority`, `category` |
| `FeatureToggle` | Feature flags | `key`, `enabled`, `updatedBy` |
| `PortalAuditLog` | Every portal action | `action`, `entityType`, `entityId`, `metadata` (before/after snapshot) |
| `PortalEmailLog` | Portal email delivery log | `senderRole`, `recipientEmail`, `status`, `retryCount` |
| `EmailTemplate` | Reusable email templates | `name`, `htmlBody`, `variables[]`, `type` |
| `PortalSecureAsset` | Binary assets (e.g. signature) | `key`, `mimeType`, `dataBase64` |
| `PortalRefreshToken` | HR portal refresh tokens | `staffId`, `token`, `expiresAt` |
| `HRAssessment` | HR-created assessments | `type`, `questions` (JSON), `duration`, `passingScore` |
| `HRAssessmentAssignment` | Assessment sent to candidate | `status`, `score`, `answers` (JSON) |

### Company Portal & External Jobs
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Company` | Hiring company account | `slug`, `domain`, `status`, `autoApplyEnabled`, `verifiedAt` |
| `CompanyMember` | Company staff | `email`, `role` (ADMIN/HIRING_MANAGER/HR_RECRUITER), `inviteToken`, `magicLinkToken` |
| `ExternalJob` | Job posting by company | `title`, `slug`, `employmentType`, `salaryMin/Max`, `autoApplyEnabled`, `expiresAt` |
| `ExternalJobApplication` | Candidate application | `status` (6 stages), `fluenzyScore`, `confidenceScore`, `isAutoApplied` |
| `Assessment` | Company assessment | `type` (MCQ/CODING/AI_INTERVIEW/VOICE/GD/CORPORATE_VOICE), `questions` (JSON), `config` (JSON), `aiGenerated` |
| `AssessmentResult` | Candidate result | `score`, `passed`, `breakdown` (JSON), `aiFeedback`, `flagged`, `cheatingEvents` |
| `CandidateAssessmentSession` | Session for company assessment | `sessionToken`, `agoraChannel`, `agoraToken`, `gdRoomId`, `aiTranscript` |
| `CandidateUser` | External candidate account | `email`, `password`, `isVerified` |
| `CandidateProfile` | Candidate profile | `skills[]`, `resumeUrl`, `linkedin`, `portfolio`, `profileCompletion` |
| `CandidateJobPreferences` | Auto-apply settings | `autoApplyEnabled`, `targetRoles[]`, `excludeCompanies[]`, `monthlyLimit` |
| `AutoApplyLog` | Auto-apply tracking | `candidateId`, `jobId`, `status` |
| `JobSearchResume` | Job search engine resume | used for AI job matching |
| `JobSearchSaved` | Saved jobs | |
| `JobSearchApplication` | Application tracking | |

### Chat System
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `FriendRequest` | Friend connection request | `senderId`, `receiverId`, `status` |
| `Friendship` | Confirmed friends | `userId`, `friendId` |
| `ChatGroup` | Group chat | `name`, `description`, `creatorId`, `isPublic`, `encryptionKey` |
| `GroupMember` | Group membership | `userId`, `role`, `canSendMessages`, `encryptedGroupKey` |
| `Conversation` | DM or group conversation | `isGroup`, `encryptionKey`, `keyVersion` |
| `ConversationParticipant` | User in conversation | `userId`, `lastReadAt`, `isArchived`, `encryptedKey` |
| `Message` | Chat message | `content`, `isEncrypted`, `encryptedContent`, `nonce`, `keyVersion`, `isDeleted`, `reactions[]` |
| `MessageReadStatus` | Read receipt | `userId`, `messageId`, `readAt` |
| `MessageReaction` | Emoji reaction | `userId`, `messageId`, `emoji` |
| `UserEncryptionKey` | Public key bundle (server) | `deviceId`, `publicKey`, `identityKey`, `signedPreKey`, `oneTimePreKeys[]` |

### Marketing System
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `MarketingAdmin` | Marketing platform staff | `email`, `permissions` (JSON), `loginAttempts` |
| `MarketingCampaign` | Email campaign | `subject`, `bodyHtml`, `senderType`, `status`, stats (sent/opened/clicked/bounced), `segmentFilters` (JSON) |
| `MarketingEmailLog` | Per-email delivery log | `status` (9 states), `messageId`, tracking timestamps |
| `MarketingRecipient` | External email contacts | `email`, `tags[]`, `status`, engagement stats |
| `UserSegment` | Audience segment | `name`, `filters` (JSON), `userCount` |
| `AutomationTrigger` | Behavioral email trigger | `conditionType`, `params` (JSON), `emailTemplate`, `isActive` |
| `UnsubscribeRecord` | Opt-out tracking | `email`, `reason`, `unsubscribedAt` |

### Notifications
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Notification` | In-app notification | `title`, `message`, `type`, `isRead`, `sentBy`, `sentByRole` |
| `EmailLog` | Super admin broadcast log | `subject`, `recipients[]`, `recipientType`, `status` |

---

## 11. API Reference

All API routes are in `src/app/api/`. They follow Next.js 15 App Router conventions (`route.ts` files).

### Authentication APIs
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/send-otp` | No | Send signup OTP to email |
| POST | `/api/auth/verify-otp` | No | Verify OTP, create user on success |
| POST | `/api/auth/resend-otp` | No | Resend OTP (max 3 attempts) |
| POST | `/api/auth/forgot-password` | No | Send password reset OTP |
| POST | `/api/auth/reset-password` | No | Set new password after OTP verification |
| POST | `/api/auth/track-login` | Yes | Record login event with device info |
| POST | `/api/auth/track-logout` | Yes | Record logout and session duration |
| GET/POST | `/api/auth/[...nextauth]` | — | NextAuth handler (Google OAuth, credentials) |

### Training / Session APIs
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/session-start` | Yes | Initialize a training session, decrement usage |
| POST | `/api/evaluate-answer` | Yes | Submit answer → Gemini scores it, returns feedback + idealAnswer |
| POST | `/api/lesson-complete` | Yes | Mark English lesson complete, increment lessonProgress |
| GET | `/api/lesson-progress` | Yes | Get completed lessons for current user |
| POST | `/api/daily-complete` | Yes | Mark daily conversation complete |
| POST | `/api/hr-complete` | Yes | Mark HR lesson complete |
| GET | `/api/hr-progress` | Yes | Get HR progress |
| POST | `/api/gd-complete` | Yes | Mark GD lesson complete |
| GET | `/api/gd-progress` | Yes | Get GD progress |
| POST | `/api/technical-complete` | Yes | Mark technical lesson complete |
| POST | `/api/mock-complete` | Yes | Mark mock interview complete |
| POST | `/api/company-complete` | Yes | Mark company-track session complete |
| GET | `/api/check-module-access` | Yes | Check if user can start a module session |
| GET | `/api/training-usage` | Yes | Get current month usage across all modules |
| GET | `/api/sessions` | Yes | Get all completed sessions for history page |

### AI APIs
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/ai/*` | Yes | Various Gemini-powered endpoints |
| POST | `/api/interview` | Yes | Generate interview questions for a role |
| POST | `/api/interview-guide` | Yes | Generate AI-powered personalized study guide |
| POST | `/api/interview-guide-complete` | Yes | Save generated guide to DB |
| GET | `/api/latest-topics` | Yes | Get latest topics asked by companies |

### Group Discussion (GD) APIs
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/gd/queue/join` | Yes | Add user to matchmaking queue |
| POST | `/api/gd/queue/leave` | Yes | Remove user from queue |
| GET | `/api/gd/queue/status` | Yes | Get queue status and position |
| POST | `/api/gd/session/create` | Yes | Create GD session (GD Coach / AI Agents mode) |
| GET | `/api/gd/session/[id]` | Yes | Get session details |
| POST | `/api/gd/session/[id]/complete` | Yes | End session, trigger scoring |
| GET | `/api/gd/history` | Yes | Get user's GD history |
| GET | `/api/gd/token` | Yes | Generate Agora RTC token for GD room |
| GET | `/api/gd/analytics/[id]` | Yes | Get session analytics |

### Billing & Payment APIs
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/user-plan` | Yes | Get current plan and usage |
| GET | `/api/plan-pricing` | No | Get pricing for all plans |
| POST | `/api/create-razorpay-order` | Yes | Create Razorpay order (one-time payment) |
| POST | `/api/verify-razorpay-payment` | Yes | Verify payment signature, activate plan |
| POST | `/api/razorpay-webhook` | No (signed) | Handle Razorpay subscription webhooks |
| GET | `/api/payment-history` | Yes | Get payment history |
| POST | `/api/subscription-renewal` | Yes | Manual subscription renewal |
| GET/POST | `/api/coupons` | SUPER_ADMIN | Manage discount coupons |

### ATS APIs
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/ats/upload` | Yes | Upload resume (PDF/DOCX) to R2, extract text |
| POST | `/api/ats/analyze` | Yes | Run AI scoring analysis on uploaded resume |
| GET | `/api/ats/results` | Yes | Get user's ATS analysis history |
| GET | `/api/ats/ranking` | Yes | Get leaderboard rank |
| DELETE | `/api/ats/[id]` | Yes | Delete resume analysis |

### User & Profile APIs
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/users/me` | Yes | Get current user data |
| PATCH | `/api/users/me` | Yes | Update user name/avatar |
| GET | `/api/profile` | Yes | Get full profile (with all sub-models) |
| POST/PATCH | `/api/profile` | Yes | Create or update user profile |
| GET | `/api/public-profile/[username]` | No | Get public profile if enabled |
| GET | `/api/analytics` | Yes | Get personal analytics (scores, trends) |
| GET | `/api/history` | Yes | Get session history with transcripts |

### Admin APIs (SUPER_ADMIN only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | `/api/admin/users` | SA | List, search, disable/enable users |
| GET/POST | `/api/admin/coupons` | SA | CRUD coupons |
| GET/POST | `/api/admin/plan-pricing` | SA | Update plan prices and limits |
| GET/POST | `/api/admin/notifications` | SA | Send notifications to users |
| GET/POST | `/api/admin/email` | SA | Send email blasts |
| GET/POST | `/api/admin/college` | SA | Approve/reject college registrations |
| GET/POST | `/api/admin/marketing/*` | Marketing | Marketing campaign management |
| GET/POST | `/api/superadmin/*` | SA | Analytics, feature toggles, ATS rankings |

### Portal APIs (HR Portal — requires Portal JWT)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/portal/auth/login` | No | HR portal login |
| POST | `/api/portal/auth/refresh` | Portal | Refresh access token |
| GET/POST | `/api/portal/employees` | Portal | CRUD employees |
| GET/POST | `/api/portal/candidates` | Portal | CRUD candidates |
| GET/POST | `/api/portal/interviews` | Portal | Schedule interviews |
| GET/POST | `/api/portal/leaves` | Portal | Manage leave requests |
| GET/POST | `/api/portal/attendance` | Portal | Record attendance |
| GET/POST | `/api/portal/payroll` | Portal | Process payroll |
| GET/POST | `/api/portal/offer-letters` | Portal | Generate offer letters |
| GET/POST | `/api/portal/certificates` | Portal | Issue certificates |
| GET/POST | `/api/portal/assessments` | Portal | Create and assign assessments |
| GET/POST | `/api/portal/email` | Portal | Send emails to candidates/employees |
| GET | `/api/portal/audit-logs` | ADMIN | View audit trail |

### College APIs (College JWT)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/college/auth/register` | No | Register college (pending approval) |
| POST | `/api/college/auth/login` | No | College admin login |
| GET/POST | `/api/college/students` | College | Bulk import/manage students |
| GET/POST | `/api/college/batches` | College | Create/manage student batches |
| GET/POST | `/api/college/competitions` | College | Create/manage competitions |
| POST | `/api/college/invite` | College | Send onboarding invites to students |
| GET | `/api/college/analytics` | College | Student usage analytics |

### Company Portal APIs (Company JWT)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/company/auth/register` | No | Register company |
| POST | `/api/company/auth/login` | No | Company member login |
| GET/POST | `/api/company/jobs` | Company | CRUD job postings |
| GET/POST | `/api/company/applications` | Company | Manage applications |
| GET/POST | `/api/company/assessments` | Company | Create AI assessments |
| POST | `/api/company/assessments/assign` | Company | Assign assessment to candidate |
| GET | `/api/company/analytics` | Company | Hiring funnel analytics |

### Chat APIs (NextAuth JWT)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | `/api/chat/conversations` | Yes | List/create conversations |
| GET/POST | `/api/chat/messages/[id]` | Yes | Get/send messages |
| POST | `/api/chat/friends/request` | Yes | Send friend request |
| POST | `/api/chat/friends/respond` | Yes | Accept/reject friend request |
| GET/POST | `/api/chat/groups` | Yes | Create/join chat groups |
| POST | `/api/chat/encryption/register` | Yes | Register device public keys |
| GET | `/api/chat/encryption/conversation-key/[id]` | Yes | Get symmetric key for conversation |
| POST | `/api/chat/encryption/init-conversation` | Yes | Initialize E2E encryption for new conversation |

---

## 12. Core Training Modules

FluenzyAI offers eight distinct training module types, each with its own usage counter and scoring system:

### 1. English Learning (`englishUsage`)
- Daily conversational English lessons structured as dialogues
- STT (Speech-to-Text) errors are automatically corrected by Gemini
- Scoring on: clarity, grammar, confidence, relevance
- Progress tracked in `LessonProgress`

### 2. Daily Conversation (`dailyUsage`)
- Short daily practice sessions
- Different topic each day
- Tracked in `dailyUsage` counter

### 3. HR Interview Practice (`hrUsage`)
- HR behavioral questions (STAR method focus)
- Multi-turn conversations with AI
- Session transcript stored with per-question scores
- Tracked in `HRProgress`

### 4. Technical Interview (`technicalUsage`)
- Role-specific technical questions (Software, Data, Finance, etc.)
- Code discussion, system design, problem-solving
- AI evaluates on technical accuracy, communication, problem-solving approach

### 5. Company Tracks (`companyUsage`)
- Company-specific preparation (targeted for specific companies like Google, TCS, etc.)
- Real-time video analysis via Python backend (YOLOv8 behavioral detection)
- Interview room opened via Agora RTC

### 6. Mock Interview (`mockUsage`)
- Full end-to-end mock interview with timer
- Combines HR + Technical questions
- Generates final PASS/FAIL aggregate score

### 7. GD Coach (`gdCoachUsage`)
- Guided GD preparation
- Separate from live GD agent sessions

### 8. Group Discussion — Live (`gdUsage`)
Three GD sub-modes:
- **AI Agents:** User faces 3–5 AI participants in an Agora RTC room
- **Private GD:** User creates a private room, shares link with friends
- **Random Matching:** Real-time matchmaking via Socket.IO, matched with 3–8 users

### Session Lifecycle
```
1. User clicks "Start Session"
2. POST /api/check-module-access → verifies usage limit
3. POST /api/session-start → creates ActiveSession record, decrements usageCount
4. Training session runs (questions ↔ answers via /api/evaluate-answer)
5. Session ends → POST /api/{module}-complete → 
   - Updates ActiveSession status to "completed"
   - Creates Session + Transcript records
   - Increments MonthlyUsage
6. User sees score breakdown and ideal answers
```

**Anti-refresh protection:** Once `session-start` is called and `ActiveSession` is set to `active`, the usage count is already consumed. If the user refreshes or closes the tab without completing, the session is counted as consumed. This prevents the exploit of starting sessions and refreshing to "free" retries.

---

## 13. AI / ML Integration

### Google Gemini (Primary AI)

FluenzyAI uses two Gemini models:

| Model | Use Case |
|-------|----------|
| `gemini-1.5-flash` | Answer evaluation, MCQ generation, coding challenges, interview question generation, campaign content |
| `gemini-1.5-pro` | Full interview transcript evaluation (higher quality, slower) |

**Key `src/lib/gemini.ts` functions:**

```typescript
generateMCQQuestions(topic, count, difficulty)    // → MCQQuestion[]
generateCodingChallenge(topic, difficulty)         // → CodingQuestion
evaluateTextAnswer(question, answer, modelAnswer)  // → EvaluationResult
evaluateMCQAnswers(questions, userAnswers)         // → EvaluationResult (local, no API)
evaluateCodingSubmission(code, lang, testCases)    // → EvaluationResult
generateInterviewQuestions(role, level, history)   // → string[]
evaluateInterviewTranscript(role, transcript)      // → EvaluationResult
```

**Answer Evaluation Prompt Design** (`/api/evaluate-answer`):
- Role: "Fluenzy AI, advanced AI Interview Coach"
- Handles Hindi-English mix and STT transcription errors
- Critical rules: Never zero scores unless silent; fix STT artifacts (e.g., "Germany API" → "Gemini API")
- Returns structured JSON: `{ clarity, relevance, grammar, confidence, technicalAccuracy, perQuestionScore, aiFeedback, idealAnswer }`
- `idealAnswer` is a complete professional rewrite of the candidate's answer

### Interview Guide Generation
- Input: `targetRole`, `targetCompany`, `experienceLevel`, `communicationLevel`, `jobDescription` (optional)
- Output: Full structured JSON study plan with topics, resources, practice questions
- Stored in `InterviewGuide.generatedContent`, optionally exported as PDF to R2

### Python Backend AI (YOLOv8 + MediaPipe)

The Python backend at port 8000 provides WebSocket-based real-time video analysis:

**Detection classes targeted:**
- `person` (presence/absence, count)
- `cell phone` (phone usage detection)
- `laptop`, `book`, `car`, `truck`, `bus`

**Alert types generated:**
- `PHONE_DETECTED` — phone visible in restricted zone
- `NO_FACE` — no face detected (looking away)
- `MULTIPLE_PERSONS` — more than one person in frame
- `SUSPICIOUS_MOVEMENT` — abrupt movement pattern
- `PHONE_USAGE` — phone being used during session
- `NO_PERSON` — candidate left frame

**Behavioral Analysis** (`behavioral_analysis.py`):
- MediaPipe Face Mesh: gaze direction, head pose, eye contact score
- MediaPipe Pose: body language, posture score
- MediaPipe Hands: gesture analysis
- Outputs `BehavioralMetrics`: eye contact score, head movement, posture stability

**WebSocket Protocol:**
```
Client → Server:  { type: "frame", data: "<base64 JPEG>" }
Server → Client:  { type: "detection_result", data: FrameAnalysis }
                  { type: "behavioral_update", data: BehavioralMetrics }
                  { type: "alert", data: { type: AlertType, message: string } }
```

---

## 14. Real-Time Features

### Socket.IO Architecture

Socket.IO is initialized in `server.js` (production) and `src/lib/socketServer.ts` (development compatibility). It runs at path `/api/socket/io`.

**GD Matchmaking Queue System:**
```
Queue key format: "{participantCount}-{difficulty}-{mode}"
Example: "5-Medium-Corporate"

Events:
  Client → Server: "join-queue"     { userId, userName, participantCount, difficulty, mode }
  Server → Client: "queue-status"   { status: "waiting", position: N, message: "..." }
  Server → Client: "match-found"    { roomId, sessionId, channelName, topic, participants[] }

  Client → Server: "leave-queue"
  Client → Server: "join-room"      roomId
  Client → Server: "leave-room"     roomId
  Client → Server: "end-session"    { roomId }
  Server → Client: "session-ended"  { reason: "Host ended session" }
```

**Interview Matchmaking (Role-based 1:1):**
- Queue key: `"{interviewType}-{role}"` (e.g., `"PI-HR"`, `"Technical-Candidate"`)
- Strict role pairing: HR paired with Candidate, EngineeringManager paired with Candidate
- 5-minute timeout if no match found
- Private interview rooms supported (many-to-many)

### Agora RTC Integration

Used for actual audio/video streaming in GD rooms and interview rooms.

**Token generation** (`src/lib/agoraToken.ts`):
- Uses `AGORA_APP_CERTIFICATE` to sign tokens server-side
- Tokens are role-specific (publisher/subscriber)
- Expire after configurable duration

**GD Room flow:**
```
1. Socket.IO match-found → client gets channelName + sessionId
2. Client calls GET /api/gd/token?channel={channelName}&uid={uid}
3. Client joins Agora channel with returned token
4. Audio/video streams established peer-to-peer via Agora infrastructure
5. GD session transcript streamed to /api/gd/session/[id]/transcript
6. On end, /api/gd/session/[id]/complete triggers scoring
```

---

## 15. Group Discussion (GD) System

The GD system is one of the most complex features, with three modes and integrated AI scoring.

### GD Modes
| Mode | Description |
|------|-------------|
| `Corporate` | Business & workplace topics |
| `CurrentAffairs` | Current events, policy, global issues |
| `Abstract` | Philosophical and abstract reasoning |
| `BusinessEthics` | Ethical dilemmas in business |
| `Technology` | Tech trends, AI, digital transformation |
| `Random` | Mixed from all categories |

### GD Phases (state machine)
```
Waiting → Initiation → Discussion → Analysis → Summary → Completed
```

### GD Roles (assigned on match)
```
Initiator   — Sets the context and opens the discussion
Moderator   — Keeps discussion on track, manages time
Analyzer    — Provides data, facts, and deeper analysis
Challenger  — Questions assumptions, devil's advocate
Supporter   — Builds on others' points, collaborative
InfoProvider— Brings specific domain knowledge
Summarizer  — Synthesizes at the end
Opposer     — Argues counter-position
```

Role assignment scales with participant count (3–8 participants).

### Scoring Dimensions
| Score | Description |
|-------|-------------|
| `overallScore` | Composite (0–100) |
| `communicationScore` | Clarity and articulation |
| `confidenceScore` | Tone and assertiveness |
| `grammarScore` | Language correctness |
| `relevanceScore` | Staying on topic |
| `leadershipScore` | Initiative and direction-setting |
| `roleScore` | How well they performed their assigned role |

### Real-time Analytics
`GDAnalytics` captures per-session metrics:
- `speakingTime` — total seconds spoken
- `interruptions` — times the user was interrupted
- `silenceDuration` — time silent when expected to speak
- `paceScore` — words per minute
- `fillerWordCount` — "um", "uh", "like" count
- `volumeStability` — microphone volume variance

---

## 16. ATS (Resume Scoring) System

### Resume Upload & Parsing

**Supported formats:** PDF, DOCX

1. File uploaded via `POST /api/ats/upload`
2. Stored in Cloudflare R2 at `ats-resumes/{userId}_{uuid}.{ext}`
3. Text extracted:
   - **PDF:** `pdf-parse` library + custom pure-JS PDF stream parser (fallback) in `ats-engine.ts`
   - **DOCX:** `mammoth` library converts to plain text
4. Extracted text stored in `ATSResume.rawText`

### ATS Scoring Algorithm

`POST /api/ats/analyze` with `{ resumeId, jobDescription?, targetRole? }`:

The Gemini model analyzes the resume text and returns scores (0–100) for:

| Score | Description |
|-------|-------------|
| `atsScore` | Composite ATS compatibility score |
| `keywordScore` | Match of job-relevant keywords |
| `skillsScore` | Technical and soft skills coverage |
| `formatScore` | Resume structure and ATS-parseability |
| `experienceScore` | Relevance and depth of experience |
| `educationScore` | Educational qualifications match |
| `readabilityScore` | Language clarity and flow |
| `sectionScore` | Presence of essential resume sections |

Also returns:
- `matchedKeywords[]` — found keywords
- `missingKeywords[]` — important keywords absent from resume
- `suggestions[]` — actionable improvement tips
- `strengths[]` — what the resume does well
- `jobTitleMatch` — best matching job title
- `experienceYears` — detected years of experience

### ATS Leaderboard

Users can opt into `ATSRanking` to see their rank vs. other users, filterable by `college` and `jobRole`.

---

## 17. HR & Admin Portal System

The HR Portal (`/portal`) is a standalone HRMS (Human Resource Management System) within FluenzyAI.

### Access Control
- `PortalRole.ADMIN`: Full access — employees, candidates, assessments, audit logs, email, offer letters, certificates, payroll
- `PortalRole.HR`: Employee management, candidate pipeline, leave approvals, attendance, assessments
- Granular `permissions` JSON field allows fine-grained overrides per staff member

### Core HR Workflows

**Employee Onboarding:**
```
1. HR creates Employee record (employeeCode auto-generated)
2. HR uploads documents (stored in R2)
3. Employee added to HR's assigned employees list
```

**Candidate Pipeline (9-stage):**
```
APPLIED → SCREENING → INTERVIEW_SCHEDULED → INTERVIEWED → 
SELECTED → OFFER_SENT → ONBOARDED → REJECTED | WITHDRAWN
```

**Leave Management:**
```
Employee submits LeaveRequest → HR reviews → APPROVED/REJECTED
Leave types: CASUAL, SICK, EARNED, MATERNITY, PATERNITY, UNPAID
```

**Payroll Processing:**
```
1. HR creates PayrollRecord (month, year, basicSalary, allowances, deductions)
2. netSalary = basicSalary + allowances - deductions
3. Status: PENDING → PROCESSED → PAID
```

**Certificate Issuance:**
```
1. HR selects CertificateTemplate (HTML with {{variables}})
2. Fills in data (JSON)
3. System generates PDF via Puppeteer
4. QR code generated pointing to public verification URL
5. Certificate emailed to recipient
6. CertificateVerification created on each public verify
```

**Offer Letter Generation:**
```
1. HR creates OfferLetter (position, salary, joiningDate, content HTML)
2. Puppeteer renders HTML → PDF
3. PDF uploaded to R2 (offer-letters/ prefix)
4. Sent via email with deadline for acceptance
```

### Security Features
- Login attempt tracking with account lockout (`lockedUntil`)
- All actions logged to `PortalAuditLog` with before/after snapshots
- Refresh token rotation stored in `PortalRefreshToken`
- Password reset via `passwordResetToken` (time-limited)

---

## 18. College Admin System

Colleges register and manage their students' access to FluenzyAI's training platform.

### Registration Flow
```
1. College admin registers at /college/register
2. OTP sent to college email
3. Pending approval status until SUPER_ADMIN approves
4. On approval: college gets seats allocation, plan, moduleLimits
5. College admin can create batches and add students
```

### Student Management
```
1. Admin creates CollegeStudent records (bulk CSV import supported)
2. System generates inviteToken for each student
3. Invite email sent with onboarding link
4. Student sets password, links to users record
5. Student inherits college's plan and moduleLimits
```

### Billing
- Colleges are billed centrally per seat
- `CollegeTransaction` tracks Razorpay orders for seat purchases
- `studentEmails[]` on transaction: students to activate on payment success
- GST included in `gstAmount` field

### Competitions
- Colleges can create competitions for their students
- Tied to `CompanyMember` assessments for cross-platform access

---

## 19. Company Portal & External Jobs

The **HireLens** system (`/hirelens`) enables companies to post jobs and evaluate candidates with AI.

### Company Registration & Verification
```
1. HR/Admin registers company (OTP verification)
2. Company profile: name, domain, logo, industry, size
3. `CompanyMember` created with ADMIN role
4. Additional members invited via `inviteToken` (magic link available)
```

### Job Posting Flow
```
1. Company admin creates ExternalJob (title, JD, requirements, skills)
2. Job published at /jobs/{companySlug}/{jobSlug}
3. Candidates apply via CandidateUser account
4. Application tracked through AppStatus pipeline
```

### AI Assessment Types
| Type | Description |
|------|-------------|
| `MCQ` | Multiple-choice questions (Gemini-generated or manual) |
| `CODING` | Coding challenge with test cases |
| `AI_INTERVIEW` | Live AI interview session (Gemini) |
| `VOICE` | Voice-based response assessment (Agora) |
| `GD` | Group discussion with other candidates |
| `CORPORATE_VOICE` | Advanced: read_aloud, listen_repeat, etc. |

### Anti-Cheat Features
`AssessmentResult.cheatingEvents` JSON captures:
- Tab switches / focus loss
- Copy-paste events
- Screen recording attempts
`AssessmentResult.flagged` = true if cheating detected

### Auto-Apply System
Candidates with `autoApplyEnabled: true` in their preferences automatically apply to matching jobs:
- Matching by `targetRoles[]`, `targetLocations[]`, `targetTypes[]`
- `excludeCompanies[]` honored
- Monthly limit enforced via `CandidateJobPreferences.monthlyLimit`
- `AutoApplyLog` tracks every auto-apply attempt and result

---

## 20. Marketing & Email Automation

### Campaign Management
Campaigns support:
- HTML email body with variables (`{{name}}`, `{{plan}}`, etc.)
- Sender types: `news`, `contact`, `careers`, `support`
- Scheduling (`scheduledAt`)
- Real-time stats: sent, delivered, opened, clicked, bounced, unsubscribed

### Audience Segmentation (`UserSegment`)
Segments are defined by JSON filter rules that can query:
- Plan (Free/Pro/Enterprise)
- Last login date
- Module usage frequency
- Inactivity duration

### Behavioral Automation (`AutomationTrigger`)
Trigger types:
| Trigger | When |
|---------|------|
| `quick_submit` | User submits very fast (possible cheating) |
| `incomplete_module` | User started but didn't finish a session |
| `inactive` | No login for N days |
| `upgrade` | User upgrades plan |
| `low_score` | Score below threshold |
| `completion` | Completes all lessons in a module |
| `new_signup` | New user registered |
| `plan_upgrade` / `plan_downgrade` | Plan changed |

### Email Delivery
- Primary: Brevo API (`@getbrevo/brevo`)
- `MarketingEmailLog` tracks every email through 9 status states
- Bounce and unsubscribe handling via `UnsubscribeRecord`
- `CRON_SECRET`-protected cron endpoint processes scheduled campaigns

---

## 21. Billing & Subscription System

FluenzyAI uses **Razorpay** for Indian payment processing.

### Subscription Flow (Monthly/Annual)
```
1. User selects plan on /billing
2. POST /api/create-razorpay-order → creates Razorpay order/subscription
3. Razorpay checkout.js opens on frontend
4. On payment success → POST /api/verify-razorpay-payment
   - Verifies signature with RAZORPAY_WEBHOOK_SECRET
   - Updates users.plan and renewalDate
   - Creates PaymentHistory + Receipt records
   - Resets module usage counters
5. Subscription renewals handled via POST /api/razorpay-webhook
   - Events: payment.authorized, subscription.renewed, subscription.cancelled
   - All events stored in RazorpayWebhookEvent for audit
```

### Coupon System
```
Coupon types:
  PERCENTAGE: e.g., 20% off → finalAmount = price * 0.8
  FLAT:       e.g., ₹500 off → finalAmount = price - 500

Validation:
  - Code uniqueness
  - Expiry date check
  - maxUsage and perUserLimit enforcement
  - applicablePlans[] filter
  - usedCount incremented on redemption
```

### Usage Limit Enforcement (`serverAccessCheck.ts`)
```typescript
// Called at session-start for every module
async enforceModuleAccess(userId, module) {
  1. Get user plan and current MonthlyUsage
  2. Get PlanPricing.moduleLimits for the user's plan
  3. If usage >= limit → return 403 with { error: "limit_reached", upgradeRequired: true }
  4. Increment module usage in MonthlyUsage
  5. Return null (access granted)
}
```

Monthly usage resets based on `billingCycleStart` / `billingCycleEnd`, not calendar month.

---

## 22. File Storage — Cloudflare R2

### Configuration (`src/lib/r2.ts` + `r2-service.ts`)
```typescript
// Client configured via AWS SDK (R2 is S3-compatible)
r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
```

### File Types & Storage Paths
| FileType | R2 Path | Access |
|----------|---------|--------|
| `resume` | `resumes/{userId}_{uuid}.{ext}` | Public CDN |
| `certificate` | `certificates/{userId}_{uuid}.pdf` | Public CDN |
| `offer-letter` | `offer-letters/{userId}_{uuid}.pdf` | Public CDN |
| `profile-cert` | `profile-certs/{userId}_{uuid}.pdf` | Public CDN |
| `audit-pdf` | `audit-pdfs/{userId}_{uuid}.pdf` | Signed URL (5 min) |
| `job-resume` | `job-resumes/{userId}_{jobSlug}_{uuid}.pdf` | Public CDN |
| `payment-receipt` | `receipts/{userId}_{uuid}.pdf` | Signed URL (5 min) |
| `ats-resume` | `ats-resumes/{userId}_{uuid}.{ext}` | Signed URL (5 min) |

### URL Strategy
- **Public files** (`getPublicUrl`): Returns `https://cdn.fluenzyai.app/{fileKey}` — lifetime access, served via Cloudflare CDN with caching
- **Private files** (`getSignedUrl`): Returns pre-signed S3 URL — expires in 300 seconds by default

### Storage Quota
`users.storageUsed` (bytes) tracks per-user storage. Updated on upload/delete.

### Soft Delete
`FileRecord.isDeleted = true` + `deletedAt` timestamp — actual R2 object can be deleted async by a cron job.

---

## 23. End-to-End Encrypted Chat System

### Encryption Protocol

FluenzyAI implements a **Signal Protocol-inspired** E2E encryption using NaCl (TweetNaCl):

**Key types per device:**
| Key | Algorithm | Storage |
|-----|-----------|---------|
| Identity Key Pair | `nacl.sign` (Ed25519) | IndexedDB (secret key only) |
| Signed Pre-Key | `nacl.box` (Curve25519) | IndexedDB (secret key only) |
| One-Time Pre-Keys (×20) | `nacl.box` | IndexedDB |
| Conversation Symmetric Key | `nacl.secretbox` (XSalsa20-Poly1305) | IndexedDB + server (encrypted) |

**Server receives only:**
- Public keys (identity, signed pre-key, one-time pre-keys)
- Encrypted conversation symmetric keys
- Encrypted message ciphertext + nonce

**Server NEVER sees:**
- Secret keys
- Plaintext messages

### Message Encryption Flow
```
1. Sender: getConversationKeyLocal(conversationId) → gets symmetric key from IndexedDB
2. If not cached: fetch from /api/chat/encryption/conversation-key/{id}
3. nonce = nacl.randomBytes(24)
4. ciphertext = nacl.secretbox(plaintext, nonce, symmetricKey)
5. Store { encryptedContent: base64(ciphertext), nonce: base64(nonce), keyVersion } in DB
6. Message delivered via Socket.IO to recipient
7. Recipient decrypts using their cached conversation key
```

### Group Chat Encryption
- Each group has a `encryptionKey` (encrypted group symmetric key)
- Each member stores `encryptedGroupKey` (the group key encrypted for their device)

### Key Rotation
- `refreshConversationKey(conversationId)` fetches a new key and updates local cache
- `keyVersion` field allows detecting stale keys and triggering re-fetch

---

## 24. Python Backend Service (YOLOv8 + MediaPipe)

### Startup
```bash
# Dev
backend/venv/bin/python -m uvicorn main:app --reload --port 8000 --app-dir backend

# Prod (Render.com)
uvicorn main:app --host 0.0.0.0 --port 10000
```

### WebSocket Endpoint: `ws://backend:8000/ws/{client_id}`

**Connection Manager:**
- Maintains `active_connections: Dict[str, WebSocket]`
- Per-session `AnalyticsData`: frame count, detection history, alert history, peak counts

**Frame Processing Pipeline:**
```
1. Client sends base64-encoded JPEG frame
2. Server decodes → OpenCV numpy array
3. YOLOv8 inference (conf=0.3, iou=0.5)
4. Bounding boxes parsed for target classes
5. Alerts generated based on detection rules
6. BehavioralAnalyzer.analyze(frame) → MediaPipe metrics
7. FrameAnalysis + BehavioralMetrics sent back to client
8. Analytics aggregated in session_data
```

**HTTP Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/analytics/{client_id}` | Get session analytics |
| POST | `/reset/{client_id}` | Reset session data |

### Behavioral Analysis (`behavioral_analysis.py`)

Uses MediaPipe to extract:
- **Face Mesh (468 landmarks):** Gaze direction, eye aspect ratio (blink), head pose (pitch/yaw/roll)
- **Pose (33 landmarks):** Shoulder alignment, posture score
- **Hands (21 landmarks per hand):** Gesture classification

Outputs `BehavioralMetrics`:
```python
{
  "eye_contact_score": 0.85,        # 0–1 scale
  "gaze_direction": "center",       # center/left/right/up/down
  "head_movement": 0.12,            # normalized movement magnitude
  "posture_score": 0.78,            # 0–1 scale
  "blink_rate": 18,                 # blinks per minute
  "confidence_indicators": [...]
}
```

---

## 25. Progressive Web App (PWA)

FluenzyAI is a full PWA with:

- **Manifest** (`public/manifest.json`): name, icons, theme_color, display: standalone
- **Service Worker** (`public/sw.js`): offline caching strategy
- **Meta tags** in `layout.tsx`: apple-mobile-web-app-capable, theme-color
- **PWARegister** component: registers SW on mount

### Theme Configuration
- Default theme: `dark`
- Stored in `localStorage` under key `fluenzy-theme`
- Values: `dark`, `light`, `system`
- Flash prevention: inline `<script>` in `<head>` reads theme before React hydrates
- `data-theme` attribute set on `<html>` for CSS custom property cascade

---

## 26. Super Admin Panel

Access: `/superadmin` (requires `role === SUPER_ADMIN`)

### Capabilities
| Feature | Description |
|---------|-------------|
| **User Management** | Search, view, disable/enable any user; reset plans |
| **Plan Pricing** | Edit prices, module limits, enable/disable plans |
| **Coupon Management** | Create PERCENTAGE/FLAT coupons, set expiry and limits |
| **College Approval** | Approve/reject/suspend college admin registrations |
| **Portal Staff** | Create HR portal admin/HR staff accounts |
| **Marketing** | (Delegated to MarketingAdmin) |
| **Email Blast** | Send HTML emails to all users or filtered segment |
| **Notifications** | Push in-app notifications to all or specific users |
| **Feature Toggles** | Enable/disable features via `FeatureToggle` flags |
| **ATS Rankings** | View global leaderboard, assign ranks |
| **Latest Topics** | Manage company-specific interview topic database |
| **Analytics** | Platform-wide usage analytics, revenue, session counts |
| **Audit Logs** | View portal audit trail |
| **Support Tickets** | Manage user support requests |

### SUPER_ADMIN Creation
The first SUPER_ADMIN user must be created via a seed script (not through the UI) to prevent privilege escalation:
```bash
# Set role: SUPER_ADMIN manually in MongoDB or via Prisma script
npx ts-node scripts/create-super-admin.ts
```

---

## 27. Security Architecture

### Password Security
- All user passwords hashed with `bcryptjs` (bcrypt, salt rounds: 10)
- No plaintext passwords stored anywhere
- Temporary student passwords (`CollegeStudent.tempPassword`) are also bcrypt-hashed

### JWT Security
- NextAuth JWTs signed with `NEXTAUTH_SECRET` (HMAC-SHA256)
- Portal JWTs use separate secrets per portal to limit blast radius
- JWT always fetches fresh user data from DB (no stale plan/role in token)

### Account Lockout
- `PortalStaff.loginAttempts` incremented on failed login
- Locked after N attempts via `lockedUntil` timestamp
- Applies to: HR Portal, College Admin, Company Portal, Candidate Portal

### Rate Limiting
- `express-rate-limit` middleware on sensitive endpoints
- Payment, OTP, and authentication routes protected

### Webhook Verification
- Razorpay webhook: HMAC-SHA256 signature verified against `RAZORPAY_WEBHOOK_SECRET`
- Prevents replay attacks via `RazorpayWebhookEvent.webhookId` uniqueness constraint

### E2E Chat Encryption
- Client-side encryption: secret keys never leave browser
- IndexedDB used (not localStorage) — isolated per-origin
- NaCl secretbox: XSalsa20-Poly1305 (AEAD) — authenticated encryption

### API Security Patterns
- All protected routes check `getServerSession(authOptions)` before processing
- `user.disabled` check on every session endpoint
- Module access enforcement before AI calls (prevents bypassing limits)
- Portal routes verify JWT from `Authorization: Bearer <token>` header

### Content Security
- `next.config.ts` sets `poweredByHeader: false` (hides Next.js version)
- Service Worker served with `no-cache, no-store` to prevent version lock
- Resume PDFs served with `Access-Control-Allow-Origin: *` for PDF.js

### Input Validation
- `zod` schemas on all API request bodies
- Prisma provides type-safe query building (prevents NoSQL injection)
- File type validation before R2 upload (MIME type + extension check)

---

## 28. Cron Jobs & Automation

Cron endpoints require `Authorization: Bearer {CRON_SECRET}` header.

| Endpoint | Frequency | Purpose |
|----------|-----------|---------|
| `POST /api/cron/reset-usage` | Monthly | Reset usage counters for billing cycle |
| `POST /api/cron/process-campaigns` | Hourly | Process scheduled marketing campaigns |
| `POST /api/cron/cleanup-sessions` | Daily | Mark abandoned ActiveSessions |
| `POST /api/cron/cleanup-otps` | Hourly | Delete expired OTP records |
| `POST /api/cron/subscription-check` | Daily | Check expiring subscriptions, send renewal emails |

**Recommended setup:** Use Render.com cron jobs, GitHub Actions scheduled workflows, or a service like Upstash QStash to call these endpoints.

---

## 29. Certificate Management

### Certificate Types
| Type | Recipients |
|------|-----------|
| `INTERNSHIP` | Intern candidates |
| `EXPERIENCE` | Employees (experience letter) |
| `OFFER` | Candidates receiving offers |
| `RELIEVING` | Departing employees |
| `APPRECIATION` | Performance recognition |
| `TRAINING` | Trainees who completed a program |

### Generation Process
```
1. HR selects CertificateTemplate (HTML with Handlebars-style variables)
2. HR provides data JSON: { recipientName, period, role, company, ... }
3. API renders template + data → HTML
4. Puppeteer + @sparticuz/chromium renders HTML → PDF
5. QR code generated: URL = https://fluenzyai.app/verify/{certificateNumber}
6. QR embedded in PDF header/footer
7. PDF uploaded to R2 at certificates/{id}_{uuid}.pdf
8. CertificateVerification created on each public scan
```

### Public Verification
Any person scanning the QR code or visiting `/verify/{certificateNumber}` can see:
- Certificate status (ISSUED / REVOKED)
- Issue date and issuer
- Verification timestamp logged

---

## 30. Troubleshooting & FAQ

### Common Issues

**Q: `GEMINI_API_KEY environment variable is required` error**
- Ensure `GEMINI_API_KEY` is set in `.env.local`
- The server (not client) reads this variable — never use `NEXT_PUBLIC_` prefix for server-only keys

**Q: Socket.IO not connecting**
- Ensure `server.js` is used as the server entry point (`npm start`), not `next start`
- In development, `npm run dev` uses Next.js dev server; Socket.IO initializes on first API call

**Q: Prisma client errors after schema changes**
- Run `npx prisma generate` to regenerate the client
- Run `npx prisma db push` to apply schema changes to MongoDB

**Q: R2 upload fails with "R2 is not configured"**
- Verify all four R2 env vars: `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- Endpoint format: `https://{ACCOUNT_ID}.r2.cloudflarestorage.com`

**Q: Python backend not starting**
- Run `npm run backend:setup` to create the venv and install packages
- Ensure Python 3.10–3.11 is installed and in PATH
- YOLOv8 downloads `yolov8n.pt` model on first run (requires internet)

**Q: Agora RTC connection fails**
- `NEXT_PUBLIC_AGORA_APP_ID` must be set (exposed to browser)
- `AGORA_APP_CERTIFICATE` must be set (server-side only)
- Tokens expire — regenerate via `/api/gd/token` if session is long

**Q: Razorpay payment fails in test mode**
- Use `rzp_test_*` key for `RAZORPAY_KEY_ID` in development
- Test UPI: `success@razorpay`, Test Card: 4111 1111 1111 1111

**Q: College student can't log in after invite**
- Ensure `CollegeStudent.inviteToken` was sent correctly
- Student must set password through the invite link (not regular signup)
- Check `CollegeStudent.status === ACTIVE`

**Q: `next-auth` session doesn't update after plan upgrade**
- Sessions are refreshed on every JWT callback (fetches fresh from DB)
- If stale, user can sign out and sign in again to force refresh
- The `session.update()` function from `useSession()` can be called client-side

### Performance Tips
- Prisma connection pooling: In serverless/edge environments, use `lib/prisma.ts` singleton pattern (already implemented)
- R2 public files: Use CDN URL (`getPublicUrl()`) for all long-lived public assets — never pre-signed URLs
- Gemini API: Use `gemini-1.5-flash` for high-frequency evaluation; reserve `gemini-1.5-pro` for full transcript analysis
- Socket.IO: The server instance is a singleton in `server.js` — do not re-initialize

---

*This documentation covers the complete FluenzyAI platform as of version 0.1.0. For updates, consult the repository changelog and Prisma schema diff.*
