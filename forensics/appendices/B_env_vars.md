# Appendix B — Environment Variables Security Map

| Variable | Referenced In | Security Class | Notes |
|---|---|---|---|
| `ADMIN_API_KEY` | src/app/api/subscription-renewal/route.ts:19, src/app/api/subscription-renewal/route.ts:136 | secret | Never expose in client logs |
| `ADMIN_EMAIL_USER` | src/app/api/portal/admin/broadcast-email/route.ts:63, src/app/api/portal/admin/tickets/[id]/route.ts:59, src/app/api/portal/auth/forgot-password/route.ts:46 | config | Server/runtime config |
| `ADMIN_FROM` | src/lib/brevo-mail.ts:82 | config | Server/runtime config |
| `ADOBE_PDF_SERVICES_CLIENT_ID` | src/app/api/ats/check-config/route.ts:7, src/lib/adobe-pdf-extract.ts:33 | config | Server/runtime config |
| `ADOBE_PDF_SERVICES_CLIENT_SECRET` | src/app/api/ats/check-config/route.ts:8, src/lib/adobe-pdf-extract.ts:34 | secret | Never expose in client logs |
| `ADZUNA_APP_ID` | src/lib/jobs/sources/adzunaService.ts:6 | config | Server/runtime config |
| `ADZUNA_APP_KEY` | src/lib/jobs/sources/adzunaService.ts:7 | secret | Never expose in client logs |
| `AGORA_APP_CERTIFICATE` | src/app/api/competitions/[competitionId]/agora-token/route.ts:66, src/lib/agoraToken.ts:5 | config | Server/runtime config |
| `AGORA_APP_ID` | src/lib/agoraToken.ts:4 | config | Server/runtime config |
| `ARBEITNOW_BASE_URL` | src/lib/jobs/arbeitnow.ts:20 | config | Server/runtime config |
| `ASSESSMENT_FROM` | src/lib/brevo-mail.ts:81 | config | Server/runtime config |
| `BILLING_FROM` | src/lib/brevo-mail.ts:80 | config | Server/runtime config |
| `BREVO_API_KEY` | src/lib/brevo-mail.ts:60 | secret | Never expose in client logs |
| `CANDIDATE_JWT_SECRET` | src/lib/candidate-auth.ts:11 | secret | Never expose in client logs |
| `CAREERS_FROM` | src/app/api/admin/marketing/send-direct/route.ts:25, src/lib/marketing/email-service.ts:16 | config | Server/runtime config |
| `CERT_FROM` | src/lib/brevo-mail.ts:78 | config | Server/runtime config |
| `COLLEGE_JWT_SECRET` | src/app/api/competitions/[competitionId]/route.ts:44, src/app/api/competitions/route.ts:116 | secret | Never expose in client logs |
| `COMPANY_JWT_REFRESH_SECRET` | src/lib/company-auth.ts:12 | secret | Never expose in client logs |
| `COMPANY_JWT_SECRET` | src/lib/company-auth.ts:11 | secret | Never expose in client logs |
| `COMPANY_MAGIC_LINK_SECRET` | src/app/api/company/magic-link/route.ts:20, src/app/api/company/verify-magic-link/route.ts:25 | secret | Never expose in client logs |
| `CONTACT_FROM` | src/app/api/admin/marketing/send-direct/route.ts:24, src/lib/marketing/email-service.ts:15 | config | Server/runtime config |
| `CRON_SECRET` | src/app/api/cron/auto-apply/route.ts:20, src/app/api/cron/reset-quotas/route.ts:13 | secret | Never expose in client logs |
| `DEFAULT_FROM` | src/lib/brevo-mail.ts:76 | config | Server/runtime config |
| `ELEVENLABS_API_KEY` | backend/models/audio/text_to_speech.py:59 | secret | Never expose in client logs |
| `FLUENZY_GSTIN` | src/app/api/receipt-pdf/route.ts:75, src/lib/invoice-html.ts:80 | config | Server/runtime config |
| `GEMINI_API_KEY` | src/app/api/ai/conversation-response/route.ts:4, src/app/api/ai/evaluate-gd/route.ts:4, src/app/api/ai/evaluate-voice/route.ts:4, src/app/api/ai/generate-video-feedback/route.ts:4, src/app/api/ai/generate-video-feedback/route.ts:8, src/app/api/ats/extract-resume/route.ts:164 ... | secret | Never expose in client logs |
| `GOOGLE_CLIENT_ID` | src/app/api/candidates/auth/google/callback/route.ts:45, src/app/api/candidates/auth/google/route.ts:7, src/app/api/college/google-auth/route.ts:4, src/app/api/college/google-callback/route.ts:25, src/app/api/portal/auth/google/callback/route.ts:47, src/app/api/portal/auth/google/route.ts:10 ... | config | Server/runtime config |
| `GOOGLE_CLIENT_SECRET` | src/app/api/candidates/auth/google/callback/route.ts:46, src/app/api/college/google-callback/route.ts:26, src/app/api/portal/auth/google/callback/route.ts:48, src/lib/auth.ts:114 | secret | Never expose in client logs |
| `HR_EMAIL_USER` | src/app/api/portal/hr/leaves/[id]/route.ts:82, src/app/api/portal/hr/offer-letters/route.ts:146, src/app/api/portal/hr/send-email/route.ts:52, src/app/api/portal/hr/send-email/route.ts:75 | config | Server/runtime config |
| `HR_FROM` | src/app/api/careers/apply/route.ts:51, src/lib/brevo-mail.ts:79 | config | Server/runtime config |
| `HR_NOTIFICATION_EMAIL` | src/app/api/careers/apply/route.ts:51 | config | Server/runtime config |
| `JOB_CACHE_TTL_FREE` | src/lib/jobs/cache.ts:7 | config | Server/runtime config |
| `JOB_CACHE_TTL_PAID` | src/lib/jobs/cache.ts:8, src/lib/jobs/cache.ts:9 | config | Server/runtime config |
| `NEWS_FROM` | src/app/api/admin/marketing/send-direct/route.ts:23, src/lib/marketing/email-service.ts:14 | config | Server/runtime config |
| `NEXTAUTH_SECRET` | src/app/api/company/magic-link/route.ts:20, src/app/api/company/verify-magic-link/route.ts:25, src/app/api/competitions/[competitionId]/route.ts:44, src/app/api/competitions/route.ts:116, src/app/api/track/click/route.ts:10, src/app/api/track/open/route.ts:10 ... | secret | Never expose in client logs |
| `NEXTAUTH_URL` | src/app/api/college/google-auth/route.ts:5, src/app/api/college/google-callback/route.ts:9, src/app/api/portal/auth/google/callback/route.ts:24, src/app/api/portal/auth/google/route.ts:17 | config | Server/runtime config |
| `NEXT_PUBLIC_ADMIN_EMAIL` | src/app/portal/admin/broadcast-email/page.tsx:122 | public | Safe for client exposure by convention |
| `NEXT_PUBLIC_AGORA_APP_ID` | src/app/api/competitions/[competitionId]/agora-token/route.ts:65, src/components/LiveGDRoom.tsx:123, src/components/LiveInterviewRoom.tsx:221, src/components/competitions/CompetitionGDBattleRoom.tsx:180 | public | Safe for client exposure by convention |
| `NEXT_PUBLIC_API_URL` | scripts/start-backend.js:32, scripts/start-backend.js:138, src/app/company-tracks/page.tsx:97, src/hooks/useVideoAnalysis.ts:6 | public | Safe for client exposure by convention |
| `NEXT_PUBLIC_APP_URL` | src/app/api/candidates/auth/google/callback/route.ts:22, src/app/api/candidates/auth/google/route.ts:8, src/app/api/careers/apply/route.ts:90, src/app/api/company/assessments/[id]/assign/route.ts:199, src/app/api/interview/private-room/route.ts:30, src/app/api/portal/auth/forgot-password/route.ts:37 ... | public | Safe for client exposure by convention |
| `NEXT_PUBLIC_BASE_URL` | src/app/api/company/magic-link/route.ts:22, src/app/api/portal/auth/google/callback/route.ts:23, src/app/api/portal/auth/google/route.ts:16 | public | Safe for client exposure by convention |
| `NEXT_PUBLIC_CDN_BASE` | src/lib/cdn.ts:11, src/lib/r2Upload.ts:32 | public | Safe for client exposure by convention |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Learn_English/components/GDAgent.tsx:124, Learn_English/components/GDAgent.tsx:234, Learn_English/components/GDAgent.tsx:258, Learn_English/components/VoiceAgent.tsx:408, src/app/api/ai/conversation-response/route.ts:4, src/app/api/ai/evaluate-gd/route.ts:4 ... | secret | Never expose in client logs |
| `NEXT_PUBLIC_HR_EMAIL` | src/app/portal/hr/send-email/page.tsx:77 | public | Safe for client exposure by convention |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | src/app/college/billing/page.tsx:238 | secret | Never expose in client logs |
| `NEXT_PUBLIC_WS_URL` | src/app/company-tracks/page.tsx:96, src/components/VideoAnalysisPanel.tsx:226, src/components/assessments/candidate/GDAssessmentPlayer.tsx:41, src/hooks/useVideoAnalysis.ts:5 | public | Safe for client exposure by convention |
| `NODE_ENV` | scripts/start-backend.js:27, server.js:15, src/app/api/college/google-callback/route.ts:92, src/app/api/college/login/route.ts:77, src/app/api/company/auth/login/route.ts:130, src/app/api/company/auth/refresh/route.ts:68 ... | config | Server/runtime config |
| `OTP_FROM` | src/lib/brevo-mail.ts:77 | config | Server/runtime config |
| `PORT` | DOCUMENTATION.md:444, DOCUMENTATION.md:459, backend/main.py:594, server.js:16 | config | Server/runtime config |
| `PORTAL_ACCESS_SECRET` | src/lib/portal-auth.ts:11 | secret | Never expose in client logs |
| `PORTAL_REFRESH_SECRET` | src/lib/portal-auth.ts:12 | secret | Never expose in client logs |
| `R2_ACCESS_KEY_ID` | DOCUMENTATION.md:1390, scripts/upload-email-logo.ts:20, src/app/profile-certs/[filename]/route.ts:7, src/app/resumes/[filename]/route.ts:7, src/lib/r2-service.ts:67, src/lib/r2.ts:27 ... | secret | Never expose in client logs |
| `R2_ACCOUNT_ID` | scripts/upload-email-logo.ts:19, src/app/profile-certs/[filename]/route.ts:6, src/app/resumes/[filename]/route.ts:6 | config | Server/runtime config |
| `R2_BUCKET_NAME` | scripts/upload-email-logo.ts:22, src/app/profile-certs/[filename]/route.ts:9, src/app/resumes/[filename]/route.ts:9, src/lib/r2-config.ts:11, src/lib/r2-service.ts:69, src/lib/r2-service.ts:70 ... | config | Server/runtime config |
| `R2_ENDPOINT` | DOCUMENTATION.md:1388, src/app/profile-certs/[filename]/route.ts:10, src/app/resumes/[filename]/route.ts:10, src/lib/r2-service.ts:66, src/lib/r2.ts:25, src/lib/r2.ts:37 ... | config | Server/runtime config |
| `R2_PUBLIC_BUCKET_NAME` | src/lib/r2-config.ts:18 | config | Server/runtime config |
| `R2_PUBLIC_CDN_DOMAIN` | src/lib/r2-config.ts:15 | config | Server/runtime config |
| `R2_SECRET_ACCESS_KEY` | DOCUMENTATION.md:1391, scripts/upload-email-logo.ts:21, src/app/profile-certs/[filename]/route.ts:8, src/app/resumes/[filename]/route.ts:8, src/lib/r2-service.ts:68, src/lib/r2.ts:28 ... | secret | Never expose in client logs |
| `RAPIDAPI_HOST` | src/lib/jobs/jsearch.ts:25 | config | Server/runtime config |
| `RAPIDAPI_KEY` | src/lib/jobs/jsearch.ts:24 | secret | Never expose in client logs |
| `RAZORPAY_API_KEY` | src/app/api/college/billing/create-order/route.ts:18, src/app/api/college/billing/create-order/route.ts:148, src/app/api/create-razorpay-order/route.ts:11, src/app/api/create-razorpay-order/route.ts:18, src/app/api/create-razorpay-order/route.ts:252, src/app/api/razorpay-webhook/route.ts:8 ... | secret | Never expose in client logs |
| `RAZORPAY_API_SECRET` | src/app/api/college/billing/create-order/route.ts:19, src/app/api/college/billing/verify-payment/route.ts:33, src/app/api/create-razorpay-order/route.ts:12, src/app/api/create-razorpay-order/route.ts:18, src/app/api/razorpay-webhook/route.ts:9, src/app/api/verify-razorpay-payment/route.ts:12 ... | secret | Never expose in client logs |
| `RAZORPAY_WEBHOOK_SECRET` | src/app/api/college/billing/webhook/route.ts:12, src/app/api/razorpay-webhook/route.ts:35 | secret | Never expose in client logs |
| `SERP_API_KEY` | src/lib/jobs/additionalSourcesService.ts:13, src/lib/jobs/serpService.ts:150, src/lib/jobs/sources/bigTechService.ts:6, src/lib/jobs/sources/directSearchService.ts:7, src/lib/jobs/sources/flexJobsService.ts:6, src/lib/jobs/sources/foundItService.ts:6 ... | secret | Never expose in client logs |
| `SUPERADMIN_EMAIL_MANAGEMENT` | src/app/api/superadmin/portal-staff/route.ts:127 | config | Server/runtime config |
| `SUPER_ADMIN_EMAIL` | scripts/create-super-admin.js:9 | config | Server/runtime config |
| `SUPER_ADMIN_NAME` | scripts/create-super-admin.js:11 | config | Server/runtime config |
| `SUPER_ADMIN_PASSWORD` | scripts/create-super-admin.js:10 | secret | Never expose in client logs |
| `SUPPORT_FROM` | src/app/api/admin/marketing/send-direct/route.ts:26, src/lib/marketing/email-service.ts:17 | config | Server/runtime config |