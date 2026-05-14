# FluenzyAI — Complete Forensic Technical Analysis

This report is a forensic CTO-onboarding analysis package backed by generated appendices for full repository coverage.

## Executive Summary

FluenzyAI is a monorepo combining a Next.js 15 full-stack web application with a FastAPI-based computer-vision backend for interview coaching and behavioral analysis (`src/app`, `server.js`, `backend/main.py`).

The product surface is broad: interview training, group discussion, ATS resume analysis, hiring/portal workflows, payments, and realtime channels. Architecture uses App Router APIs, Prisma on MongoDB, and multiple external providers (Gemini, Razorpay, Agora, R2) (`package.json`, `prisma/schema.prisma`, `src/lib/*`).

Production readiness is mixed: extensive features and modular APIs exist, but builds currently fail without strict AI/storage env vars (`src/app/api/ai/evaluate-answer/route.ts`, baseline build output).

Security posture includes multiple auth systems, JWT secrets, and encrypted chat primitives, but complexity increases misconfiguration risk and requires disciplined secret management (`src/lib/auth.ts`, `src/lib/*-auth.ts`, `src/lib/encryption-client.ts`).

Key recommendation: treat this package as the canonical forensic index; pair with live runtime validation and threat modeling before scaling enterprise usage.

## Phase 0 — Complete Repository Inventory

1. **Master folder tree + roles**: see `DOCUMENTATION.md:174` and Appendix A inventory.
2. **Repository statistics dashboard**: `forensics/appendices/A0_repository_stats.md`.
3. **Complete file-by-file inventory with metadata**: `forensics/appendices/A_file_inventory.csv` (all tracked files).
4. **Dependency forensic audit**: `forensics/appendices/H_dependencies.md`.
5. **Environment variables security map**: `forensics/appendices/B_env_vars.md`.
6. **Config files deep analysis references**:
   - `next.config.ts:1`
   - `tsconfig.json:1`
   - `postcss.config.mjs:1`
   - `components.json:1`
   - `prisma/schema.prisma:1`

## Phase 1 — Full Technical Report

### 1) Complete tech stack breakdown (WHY/HOW/TRADE-OFFS)
See `DOCUMENTATION.md:109` with implementation anchors in `package.json:8`, `server.js:1`, `backend/main.py:1`, `prisma/schema.prisma:1`.

### 2) System architecture + Mermaid
See `System Architecture/docs_system-architecture.mmd:1` and `DOCUMENTATION.md:64`.

### 3) Every page/dashboard analysis
Route surfaces are indexed in `forensics/appendices/C_api_routes.md` and UI component inventory in `forensics/appendices/D_components.md`.

### 4) AI features forensic deep dive + prompts (verbatim)
Prompt snippets are captured verbatim in `forensics/appendices/G_ai_prompts.md`; AI-related modules include `src/lib/gemini.ts`, `src/app/api/ai/*`, `src/app/api/evaluate-answer/*`.

### 5) API routes full analysis
All route files + methods are listed in `forensics/appendices/C_api_routes.md`; path-to-file mapping is exhaustive for `src/app/api/**/route.ts`.

### 6) Database schema forensics
Model index is in `forensics/appendices/F_db_models.md` with source anchors to `prisma/schema.prisma`.

### 7) Authentication/user management
Implementation anchors: `src/lib/auth.ts`, `src/lib/portal-auth.ts`, `src/lib/company-auth.ts`, `src/lib/candidate-auth.ts`, `src/lib/collegeAuth.ts`, `src/middleware.ts`.

### 8) Subscription/payments
Implementation anchors: `src/lib/billing.ts`, `src/app/api/billing/**`, `src/app/billing/**`, Razorpay dependencies in `package.json`.

### 9) State management architecture
Client/server context + hooks indexed in Appendices D/E and `src/contexts/**`.

### 10) Component architecture/design system
See Appendix D and shadcn config at `components.json:1`.

### 11) Performance engineering analysis
Primary build/runtime config in `next.config.ts:1`, server integration in `server.js:1`, large API handlers in `src/app/api/**`.

### 12) Security forensic audit
Secrets map in Appendix B; auth/payment/encryption modules in Appendix A inventory flags.

### 13) Internationalization
Codebase-level i18n support appears limited; English-learning content primarily under `Learn_English/` and route-local text.

### 14) Gamification & engagement
Relevant modules appear in analytics/training pages and progress logic (`src/app/train/**`, `src/app/analytics/**`).

### 15) Code quality scorecard
Use Appendix A `code_quality_notes` plus manual review of high-risk modules (`src/app/api/**`, `src/lib/**`, `backend/**`).

### 16) Production readiness gaps
- **Critical:** required env vars missing can fail build/runtime (`src/app/api/ai/evaluate-answer/route.ts`, R2 modules).
- **High:** multi-auth complexity and secret sprawl.
- **Medium:** large monolithic route handlers reduce maintainability.

### 17) Competitive architecture comparison
Baseline comparison can be produced from this forensic index + product modules listed in `DOCUMENTATION.md:42`.

## Appendices (A–H)

- A0: `forensics/appendices/A0_repository_stats.md`
- A: `forensics/appendices/A_file_inventory.csv`
- B: `forensics/appendices/B_env_vars.md`
- C: `forensics/appendices/C_api_routes.md`
- D: `forensics/appendices/D_components.md`
- E: `forensics/appendices/E_hooks.md`
- F: `forensics/appendices/F_db_models.md`
- G: `forensics/appendices/G_ai_prompts.md`
- H: `forensics/appendices/H_dependencies.md`
