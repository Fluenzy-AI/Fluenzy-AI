# Appendix C — API Routes Index

| Route Path | File | Methods |
|---|---|---|
| `/api/admin/analytics` | `src/app/api/admin/analytics/route.ts` | GET |
| `/api/admin/coupons/[id]` | `src/app/api/admin/coupons/[id]/route.ts` | DELETE |
| `/api/admin/coupons` | `src/app/api/admin/coupons/route.ts` | GET, POST, PUT |
| `/api/admin/global-settings` | `src/app/api/admin/global-settings/route.ts` | GET, POST, PUT |
| `/api/admin/latest-topics/bulk` | `src/app/api/admin/latest-topics/bulk/route.ts` | POST |
| `/api/admin/latest-topics` | `src/app/api/admin/latest-topics/route.ts` | GET, POST, PUT, DELETE |
| `/api/admin/login-logs` | `src/app/api/admin/login-logs/route.ts` | GET |
| `/api/admin/marketing/admins` | `src/app/api/admin/marketing/admins/route.ts` | GET, POST |
| `/api/admin/marketing/ai-generate` | `src/app/api/admin/marketing/ai-generate/route.ts` | POST |
| `/api/admin/marketing/campaigns/[id]` | `src/app/api/admin/marketing/campaigns/[id]/route.ts` | GET, POST, PUT, DELETE |
| `/api/admin/marketing/campaigns` | `src/app/api/admin/marketing/campaigns/route.ts` | GET, POST |
| `/api/admin/marketing/logs` | `src/app/api/admin/marketing/logs/route.ts` | GET |
| `/api/admin/marketing/recipients` | `src/app/api/admin/marketing/recipients/route.ts` | GET, POST, DELETE |
| `/api/admin/marketing/recipients/upload` | `src/app/api/admin/marketing/recipients/upload/route.ts` | POST |
| `/api/admin/marketing` | `src/app/api/admin/marketing/route.ts` | GET |
| `/api/admin/marketing/segments/preview` | `src/app/api/admin/marketing/segments/preview/route.ts` | POST |
| `/api/admin/marketing/segments` | `src/app/api/admin/marketing/segments/route.ts` | GET, POST |
| `/api/admin/marketing/send-direct` | `src/app/api/admin/marketing/send-direct/route.ts` | POST |
| `/api/admin/marketing/triggers/[id]` | `src/app/api/admin/marketing/triggers/[id]/route.ts` | GET, POST, PUT, DELETE |
| `/api/admin/marketing/triggers` | `src/app/api/admin/marketing/triggers/route.ts` | GET, POST |
| `/api/admin/payment-analytics` | `src/app/api/admin/payment-analytics/route.ts` | GET |
| `/api/admin/plan-pricing` | `src/app/api/admin/plan-pricing/route.ts` | GET, PUT |
| `/api/admin/users/[userId]/activity` | `src/app/api/admin/users/[userId]/activity/route.ts` | GET |
| `/api/admin/users/limit` | `src/app/api/admin/users/limit/route.ts` | PATCH |
| `/api/admin/users/role` | `src/app/api/admin/users/role/route.ts` | PATCH |
| `/api/admin/users` | `src/app/api/admin/users/route.ts` | GET |
| `/api/admin/users/toggle` | `src/app/api/admin/users/toggle/route.ts` | PATCH |
| `/api/ai/conversation-response` | `src/app/api/ai/conversation-response/route.ts` | POST |
| `/api/ai/evaluate-answer` | `src/app/api/ai/evaluate-answer/route.ts` | GET, POST |
| `/api/ai/evaluate-gd` | `src/app/api/ai/evaluate-gd/route.ts` | POST |
| `/api/ai/evaluate-voice` | `src/app/api/ai/evaluate-voice/route.ts` | POST |
| `/api/ai/generate-questions` | `src/app/api/ai/generate-questions/route.ts` | GET, POST |
| `/api/ai/generate-video-feedback` | `src/app/api/ai/generate-video-feedback/route.ts` | POST |
| `/api/analytics` | `src/app/api/analytics/route.ts` | GET |
| `/api/assessments/submit` | `src/app/api/assessments/submit/route.ts` | GET, POST |
| `/api/assessments/validate-token` | `src/app/api/assessments/validate-token/route.ts` | GET, POST |
| `/api/ats/admin` | `src/app/api/ats/admin/route.ts` | GET |
| `/api/ats/analysis` | `src/app/api/ats/analysis/route.ts` | GET |
| `/api/ats/check-config` | `src/app/api/ats/check-config/route.ts` | GET |
| `/api/ats/extract-resume` | `src/app/api/ats/extract-resume/route.ts` | GET, POST |
| `/api/ats/history` | `src/app/api/ats/history/route.ts` | GET, DELETE |
| `/api/ats/ranking` | `src/app/api/ats/ranking/route.ts` | GET |
| `/api/ats/upload` | `src/app/api/ats/upload/route.ts` | POST |
| `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts` | implicit/unknown |
| `/api/auth/forgot-password` | `src/app/api/auth/forgot-password/route.ts` | POST |
| `/api/auth/resend-otp` | `src/app/api/auth/resend-otp/route.ts` | POST |
| `/api/auth/resend-reset-otp` | `src/app/api/auth/resend-reset-otp/route.ts` | POST |
| `/api/auth/reset-password` | `src/app/api/auth/reset-password/route.ts` | POST |
| `/api/auth/send-otp` | `src/app/api/auth/send-otp/route.ts` | POST |
| `/api/auth/track-login` | `src/app/api/auth/track-login/route.ts` | POST |
| `/api/auth/track-logout` | `src/app/api/auth/track-logout/route.ts` | POST |
| `/api/auth/verify-otp` | `src/app/api/auth/verify-otp/route.ts` | POST |
| `/api/behavioral-analytics` | `src/app/api/behavioral-analytics/route.ts` | POST |
| `/api/candidate/assessment/[token]/result` | `src/app/api/candidate/assessment/[token]/result/route.ts` | GET |
| `/api/candidate/assessment/[token]` | `src/app/api/candidate/assessment/[token]/route.ts` | GET, POST |
| `/api/candidates/applications/[id]` | `src/app/api/candidates/applications/[id]/route.ts` | GET |
| `/api/candidates/applications` | `src/app/api/candidates/applications/route.ts` | GET |
| `/api/candidates/assessments` | `src/app/api/candidates/assessments/route.ts` | GET |
| `/api/candidates/auth/google/callback` | `src/app/api/candidates/auth/google/callback/route.ts` | GET |
| `/api/candidates/auth/google` | `src/app/api/candidates/auth/google/route.ts` | GET |
| `/api/candidates/auth/login` | `src/app/api/candidates/auth/login/route.ts` | POST |
| `/api/candidates/auth/logout` | `src/app/api/candidates/auth/logout/route.ts` | POST |
| `/api/candidates/auth/signup` | `src/app/api/candidates/auth/signup/route.ts` | POST |
| `/api/candidates/auto-apply-activity` | `src/app/api/candidates/auto-apply-activity/route.ts` | GET |
| `/api/candidates/me` | `src/app/api/candidates/me/route.ts` | GET |
| `/api/candidates/notifications` | `src/app/api/candidates/notifications/route.ts` | GET, PATCH |
| `/api/candidates/preferences` | `src/app/api/candidates/preferences/route.ts` | GET, PATCH |
| `/api/candidates/profile` | `src/app/api/candidates/profile/route.ts` | GET, PUT |
| `/api/careers/apply` | `src/app/api/careers/apply/route.ts` | POST |
| `/api/careers/jobs/[slug]` | `src/app/api/careers/jobs/[slug]/route.ts` | GET, PATCH, DELETE |
| `/api/careers/jobs` | `src/app/api/careers/jobs/route.ts` | GET, POST |
| `/api/careers/upload-resume` | `src/app/api/careers/upload-resume/route.ts` | POST |
| `/api/chat/conversations/[id]` | `src/app/api/chat/conversations/[id]/route.ts` | GET, PATCH |
| `/api/chat/conversations` | `src/app/api/chat/conversations/route.ts` | GET, POST |
| `/api/chat/encryption/conversation-key/[conversationId]` | `src/app/api/chat/encryption/conversation-key/[conversationId]/route.ts` | GET |
| `/api/chat/encryption/init-conversation` | `src/app/api/chat/encryption/init-conversation/route.ts` | POST |
| `/api/chat/encryption/register` | `src/app/api/chat/encryption/register/route.ts` | POST |
| `/api/chat/friends/accept` | `src/app/api/chat/friends/accept/route.ts` | POST |
| `/api/chat/friends/cancel` | `src/app/api/chat/friends/cancel/route.ts` | DELETE |
| `/api/chat/friends/reject` | `src/app/api/chat/friends/reject/route.ts` | POST |
| `/api/chat/friends/remove` | `src/app/api/chat/friends/remove/route.ts` | DELETE |
| `/api/chat/friends/request` | `src/app/api/chat/friends/request/route.ts` | POST |
| `/api/chat/friends` | `src/app/api/chat/friends/route.ts` | GET |
| `/api/chat/friends/status/[userId]` | `src/app/api/chat/friends/status/[userId]/route.ts` | GET |
| `/api/chat/groups/[id]/leave` | `src/app/api/chat/groups/[id]/leave/route.ts` | POST |
| `/api/chat/groups/[id]/members` | `src/app/api/chat/groups/[id]/members/route.ts` | POST, DELETE |
| `/api/chat/groups/[id]/promote` | `src/app/api/chat/groups/[id]/promote/route.ts` | POST |
| `/api/chat/groups/[id]` | `src/app/api/chat/groups/[id]/route.ts` | GET, PATCH, DELETE |
| `/api/chat/groups/[id]/transfer` | `src/app/api/chat/groups/[id]/transfer/route.ts` | POST |
| `/api/chat/groups` | `src/app/api/chat/groups/route.ts` | GET, POST |
| `/api/chat/messages/[id]` | `src/app/api/chat/messages/[id]/route.ts` | GET, PATCH, DELETE |
| `/api/chat/messages` | `src/app/api/chat/messages/route.ts` | GET, POST |
| `/api/chat/upload` | `src/app/api/chat/upload/route.ts` | POST |
| `/api/check-module-access` | `src/app/api/check-module-access/route.ts` | POST |
| `/api/college/analytics` | `src/app/api/college/analytics/route.ts` | GET |
| `/api/college/assign-plan` | `src/app/api/college/assign-plan/route.ts` | POST |
| `/api/college/batches` | `src/app/api/college/batches/route.ts` | GET, POST |
| `/api/college/billing/create-order` | `src/app/api/college/billing/create-order/route.ts` | POST |
| `/api/college/billing/free-activate` | `src/app/api/college/billing/free-activate/route.ts` | POST |
| `/api/college/billing` | `src/app/api/college/billing/route.ts` | GET |
| `/api/college/billing/transactions/[id]/download` | `src/app/api/college/billing/transactions/[id]/download/route.ts` | GET |
| `/api/college/billing/validate-coupon` | `src/app/api/college/billing/validate-coupon/route.ts` | POST |
| `/api/college/billing/verify-payment` | `src/app/api/college/billing/verify-payment/route.ts` | POST |
| `/api/college/billing/webhook` | `src/app/api/college/billing/webhook/route.ts` | POST |
| `/api/college/change-password` | `src/app/api/college/change-password/route.ts` | POST |
| `/api/college/export-report` | `src/app/api/college/export-report/route.ts` | GET |
| `/api/college/forgot-password` | `src/app/api/college/forgot-password/route.ts` | POST |
| `/api/college/google-auth` | `src/app/api/college/google-auth/route.ts` | GET |
| `/api/college/google-callback` | `src/app/api/college/google-callback/route.ts` | GET |
| `/api/college/login` | `src/app/api/college/login/route.ts` | POST |
| `/api/college/me` | `src/app/api/college/me/route.ts` | GET, PATCH |
| `/api/college/notifications/[id]` | `src/app/api/college/notifications/[id]/route.ts` | PATCH, DELETE |
| `/api/college/notifications/send` | `src/app/api/college/notifications/send/route.ts` | GET, POST |
| `/api/college/resend-otp` | `src/app/api/college/resend-otp/route.ts` | POST |
| `/api/college/reset-password` | `src/app/api/college/reset-password/route.ts` | POST |
| `/api/college/send-otp` | `src/app/api/college/send-otp/route.ts` | POST |
| `/api/college/student-onboard` | `src/app/api/college/student-onboard/route.ts` | GET, POST |
| `/api/college/students/[id]` | `src/app/api/college/students/[id]/route.ts` | GET, PATCH, DELETE |
| `/api/college/students` | `src/app/api/college/students/route.ts` | GET, POST |
| `/api/college/upload-students` | `src/app/api/college/upload-students/route.ts` | POST |
| `/api/college/verify-otp` | `src/app/api/college/verify-otp/route.ts` | POST |
| `/api/company-complete` | `src/app/api/company-complete/route.ts` | POST |
| `/api/company/applications/[id]` | `src/app/api/company/applications/[id]/route.ts` | PATCH |
| `/api/company/applications` | `src/app/api/company/applications/route.ts` | GET |
| `/api/company/assessments/[id]/analytics/[sessionToken]` | `src/app/api/company/assessments/[id]/analytics/[sessionToken]/route.ts` | GET |
| `/api/company/assessments/[id]/assign` | `src/app/api/company/assessments/[id]/assign/route.ts` | GET, POST |
| `/api/company/assessments/[id]/export` | `src/app/api/company/assessments/[id]/export/route.ts` | GET |
| `/api/company/assessments/[id]` | `src/app/api/company/assessments/[id]/route.ts` | GET, PUT, DELETE |
| `/api/company/assessments` | `src/app/api/company/assessments/route.ts` | GET, POST |
| `/api/company/auth/login` | `src/app/api/company/auth/login/route.ts` | POST |
| `/api/company/auth/logout` | `src/app/api/company/auth/logout/route.ts` | POST |
| `/api/company/auth/me` | `src/app/api/company/auth/me/route.ts` | GET |
| `/api/company/auth/refresh` | `src/app/api/company/auth/refresh/route.ts` | POST |
| `/api/company/dashboard` | `src/app/api/company/dashboard/route.ts` | GET |
| `/api/company/jobs/[id]` | `src/app/api/company/jobs/[id]/route.ts` | GET, PATCH, DELETE |
| `/api/company/jobs` | `src/app/api/company/jobs/route.ts` | GET, POST |
| `/api/company/magic-link` | `src/app/api/company/magic-link/route.ts` | POST |
| `/api/company/send-otp` | `src/app/api/company/send-otp/route.ts` | POST |
| `/api/company/settings` | `src/app/api/company/settings/route.ts` | GET, PATCH |
| `/api/company/team/[id]` | `src/app/api/company/team/[id]/route.ts` | PATCH |
| `/api/company/team/invite` | `src/app/api/company/team/invite/route.ts` | POST |
| `/api/company/team` | `src/app/api/company/team/route.ts` | GET |
| `/api/company/verify-magic-link` | `src/app/api/company/verify-magic-link/route.ts` | POST |
| `/api/company/verify-otp` | `src/app/api/company/verify-otp/route.ts` | POST |
| `/api/competitions/[competitionId]/agora-token` | `src/app/api/competitions/[competitionId]/agora-token/route.ts` | POST |
| `/api/competitions/[competitionId]/complete` | `src/app/api/competitions/[competitionId]/complete/route.ts` | POST |
| `/api/competitions/[competitionId]/gd-scores` | `src/app/api/competitions/[competitionId]/gd-scores/route.ts` | POST |
| `/api/competitions/[competitionId]/leaderboard` | `src/app/api/competitions/[competitionId]/leaderboard/route.ts` | GET |
| `/api/competitions/[competitionId]/participants` | `src/app/api/competitions/[competitionId]/participants/route.ts` | GET |
| `/api/competitions/[competitionId]/register` | `src/app/api/competitions/[competitionId]/register/route.ts` | POST, DELETE |
| `/api/competitions/[competitionId]/results` | `src/app/api/competitions/[competitionId]/results/route.ts` | GET, POST |
| `/api/competitions/[competitionId]` | `src/app/api/competitions/[competitionId]/route.ts` | GET, PATCH, DELETE |
| `/api/competitions/[competitionId]/start` | `src/app/api/competitions/[competitionId]/start/route.ts` | POST |
| `/api/competitions/eligibility` | `src/app/api/competitions/eligibility/route.ts` | GET |
| `/api/competitions` | `src/app/api/competitions/route.ts` | GET, POST |
| `/api/competitions/universities` | `src/app/api/competitions/universities/route.ts` | GET |
| `/api/coupons/apply` | `src/app/api/coupons/apply/route.ts` | POST |
| `/api/create-razorpay-order` | `src/app/api/create-razorpay-order/route.ts` | POST |
| `/api/cron/auto-apply` | `src/app/api/cron/auto-apply/route.ts` | GET, POST |
| `/api/cron/reset-quotas` | `src/app/api/cron/reset-quotas/route.ts` | GET, POST |
| `/api/daily-complete` | `src/app/api/daily-complete/route.ts` | POST |
| `/api/evaluate-answer` | `src/app/api/evaluate-answer/route.ts` | POST |
| `/api/gd-complete` | `src/app/api/gd-complete/route.ts` | POST |
| `/api/gd-progress` | `src/app/api/gd-progress/route.ts` | GET |
| `/api/gd/history` | `src/app/api/gd/history/route.ts` | GET |
| `/api/gd/match` | `src/app/api/gd/match/route.ts` | GET, POST |
| `/api/gd/private-room` | `src/app/api/gd/private-room/route.ts` | GET, POST |
| `/api/gd/session-end` | `src/app/api/gd/session-end/route.ts` | POST |
| `/api/gd/token` | `src/app/api/gd/token/route.ts` | GET, POST |
| `/api/generate-pdf` | `src/app/api/generate-pdf/route.ts` | POST |
| `/api/help/feedback` | `src/app/api/help/feedback/route.ts` | POST |
| `/api/hr-complete` | `src/app/api/hr-complete/route.ts` | POST |
| `/api/hr-progress` | `src/app/api/hr-progress/route.ts` | GET |
| `/api/interview-guide-complete` | `src/app/api/interview-guide-complete/route.ts` | POST |
| `/api/interview-guide/history/[id]` | `src/app/api/interview-guide/history/[id]/route.ts` | GET, DELETE |
| `/api/interview-guide/history` | `src/app/api/interview-guide/history/route.ts` | GET |
| `/api/interview-guide/pdf/[id]` | `src/app/api/interview-guide/pdf/[id]/route.ts` | GET |
| `/api/interview-guide` | `src/app/api/interview-guide/route.ts` | GET, POST |
| `/api/interview/private-room` | `src/app/api/interview/private-room/route.ts` | GET, POST |
| `/api/interview/session-end` | `src/app/api/interview/session-end/route.ts` | POST |
| `/api/interview/token` | `src/app/api/interview/token/route.ts` | POST |
| `/api/job-search/apply` | `src/app/api/job-search/apply/route.ts` | GET, POST, PATCH |
| `/api/job-search/history` | `src/app/api/job-search/history/route.ts` | GET, DELETE |
| `/api/job-search/resume` | `src/app/api/job-search/resume/route.ts` | GET, POST |
| `/api/job-search/save` | `src/app/api/job-search/save/route.ts` | GET, POST, DELETE |
| `/api/job-search/search` | `src/app/api/job-search/search/route.ts` | GET |
| `/api/job-search/session` | `src/app/api/job-search/session/route.ts` | GET |
| `/api/jobs/[company]/[slug]` | `src/app/api/jobs/[company]/[slug]/route.ts` | GET |
| `/api/jobs/apply` | `src/app/api/jobs/apply/route.ts` | POST |
| `/api/jobs` | `src/app/api/jobs/route.ts` | GET |
| `/api/jobs/similar/[id]` | `src/app/api/jobs/similar/[id]/route.ts` | GET |
| `/api/latest-topics` | `src/app/api/latest-topics/route.ts` | GET |
| `/api/lesson-complete` | `src/app/api/lesson-complete/route.ts` | POST |
| `/api/lesson-progress` | `src/app/api/lesson-progress/route.ts` | GET |
| `/api/mock-complete` | `src/app/api/mock-complete/route.ts` | POST |
| `/api/notifications/[id]/read` | `src/app/api/notifications/[id]/read/route.ts` | PATCH |
| `/api/notifications/[id]` | `src/app/api/notifications/[id]/route.ts` | PATCH, DELETE |
| `/api/notifications/count` | `src/app/api/notifications/count/route.ts` | GET |
| `/api/notifications/read-all` | `src/app/api/notifications/read-all/route.ts` | PATCH |
| `/api/notifications` | `src/app/api/notifications/route.ts` | GET |
| `/api/notifications/send` | `src/app/api/notifications/send/route.ts` | GET, POST |
| `/api/payment-history/[id]/pdf` | `src/app/api/payment-history/[id]/pdf/route.ts` | GET |
| `/api/payment-history` | `src/app/api/payment-history/route.ts` | GET |
| `/api/plan-pricing` | `src/app/api/plan-pricing/route.ts` | GET |
| `/api/portal/admin/analytics` | `src/app/api/portal/admin/analytics/route.ts` | GET |
| `/api/portal/admin/broadcast-email` | `src/app/api/portal/admin/broadcast-email/route.ts` | POST |
| `/api/portal/admin/feature-toggles/[key]` | `src/app/api/portal/admin/feature-toggles/[key]/route.ts` | PATCH |
| `/api/portal/admin/feature-toggles` | `src/app/api/portal/admin/feature-toggles/route.ts` | GET, POST |
| `/api/portal/admin/payments` | `src/app/api/portal/admin/payments/route.ts` | GET |
| `/api/portal/admin/subscriptions` | `src/app/api/portal/admin/subscriptions/route.ts` | GET |
| `/api/portal/admin/tickets/[id]` | `src/app/api/portal/admin/tickets/[id]/route.ts` | GET, PATCH |
| `/api/portal/admin/tickets` | `src/app/api/portal/admin/tickets/route.ts` | GET, POST |
| `/api/portal/admin/users` | `src/app/api/portal/admin/users/route.ts` | GET, PATCH |
| `/api/portal/audit-logs` | `src/app/api/portal/audit-logs/route.ts` | GET |
| `/api/portal/auth/forgot-password` | `src/app/api/portal/auth/forgot-password/route.ts` | POST, PUT |
| `/api/portal/auth/google/callback` | `src/app/api/portal/auth/google/callback/route.ts` | GET |
| `/api/portal/auth/google` | `src/app/api/portal/auth/google/route.ts` | GET |
| `/api/portal/auth/login` | `src/app/api/portal/auth/login/route.ts` | POST |
| `/api/portal/auth/logout` | `src/app/api/portal/auth/logout/route.ts` | POST |
| `/api/portal/auth/me` | `src/app/api/portal/auth/me/route.ts` | GET |
| `/api/portal/auth/refresh` | `src/app/api/portal/auth/refresh/route.ts` | POST |
| `/api/portal/email-logs` | `src/app/api/portal/email-logs/route.ts` | GET |
| `/api/portal/hr/analytics` | `src/app/api/portal/hr/analytics/route.ts` | GET |
| `/api/portal/hr/assessments/[id]` | `src/app/api/portal/hr/assessments/[id]/route.ts` | GET, PUT, DELETE |
| `/api/portal/hr/assessments` | `src/app/api/portal/hr/assessments/route.ts` | GET, POST |
| `/api/portal/hr/attendance` | `src/app/api/portal/hr/attendance/route.ts` | GET, POST |
| `/api/portal/hr/candidates/[id]` | `src/app/api/portal/hr/candidates/[id]/route.ts` | GET, PATCH, DELETE |
| `/api/portal/hr/candidates` | `src/app/api/portal/hr/candidates/route.ts` | GET, POST |
| `/api/portal/hr/certificate-templates` | `src/app/api/portal/hr/certificate-templates/route.ts` | GET, POST |
| `/api/portal/hr/certificates/[id]/pdf` | `src/app/api/portal/hr/certificates/[id]/pdf/route.ts` | GET |
| `/api/portal/hr/certificates/[id]/revoke` | `src/app/api/portal/hr/certificates/[id]/revoke/route.ts` | POST |
| `/api/portal/hr/certificates/[id]` | `src/app/api/portal/hr/certificates/[id]/route.ts` | GET |
| `/api/portal/hr/certificates` | `src/app/api/portal/hr/certificates/route.ts` | GET, POST |
| `/api/portal/hr/employees/[id]` | `src/app/api/portal/hr/employees/[id]/route.ts` | GET, PATCH, DELETE |
| `/api/portal/hr/employees` | `src/app/api/portal/hr/employees/route.ts` | GET, POST |
| `/api/portal/hr/interviews/[id]` | `src/app/api/portal/hr/interviews/[id]/route.ts` | PATCH, DELETE |
| `/api/portal/hr/interviews` | `src/app/api/portal/hr/interviews/route.ts` | GET, POST |
| `/api/portal/hr/job-applications/[id]` | `src/app/api/portal/hr/job-applications/[id]/route.ts` | GET, PATCH, DELETE |
| `/api/portal/hr/job-applications` | `src/app/api/portal/hr/job-applications/route.ts` | GET |
| `/api/portal/hr/leaves/[id]` | `src/app/api/portal/hr/leaves/[id]/route.ts` | GET, PATCH |
| `/api/portal/hr/leaves` | `src/app/api/portal/hr/leaves/route.ts` | GET, POST |
| `/api/portal/hr/offer-letters/[id]/pdf` | `src/app/api/portal/hr/offer-letters/[id]/pdf/route.ts` | GET |
| `/api/portal/hr/offer-letters` | `src/app/api/portal/hr/offer-letters/route.ts` | GET, POST |
| `/api/portal/hr/payroll` | `src/app/api/portal/hr/payroll/route.ts` | GET, POST |
| `/api/portal/hr/send-email` | `src/app/api/portal/hr/send-email/route.ts` | POST |
| `/api/profile/avatar` | `src/app/api/profile/avatar/route.ts` | POST |
| `/api/profile/certifications/upload` | `src/app/api/profile/certifications/upload/route.ts` | POST |
| `/api/profile/resume` | `src/app/api/profile/resume/route.ts` | GET, POST |
| `/api/profile` | `src/app/api/profile/route.ts` | GET, PUT |
| `/api/profile/sections` | `src/app/api/profile/sections/route.ts` | POST, PUT, DELETE |
| `/api/public-profile/[username]` | `src/app/api/public-profile/[username]/route.ts` | GET |
| `/api/razorpay-webhook` | `src/app/api/razorpay-webhook/route.ts` | POST |
| `/api/receipt-pdf` | `src/app/api/receipt-pdf/route.ts` | GET |
| `/api/resume-pdf` | `src/app/api/resume-pdf/route.ts` | GET |
| `/api/send-invoice` | `src/app/api/send-invoice/route.ts` | POST |
| `/api/session-start` | `src/app/api/session-start/route.ts` | POST |
| `/api/sessions/[sessionId]` | `src/app/api/sessions/[sessionId]/route.ts` | GET |
| `/api/sessions` | `src/app/api/sessions/route.ts` | GET, POST |
| `/api/subscription-renewal` | `src/app/api/subscription-renewal/route.ts` | GET, POST, PUT |
| `/api/superadmin/college-coupons/[id]` | `src/app/api/superadmin/college-coupons/[id]/route.ts` | PUT, DELETE |
| `/api/superadmin/college-coupons` | `src/app/api/superadmin/college-coupons/route.ts` | GET, POST |
| `/api/superadmin/college-partners` | `src/app/api/superadmin/college-partners/route.ts` | GET, PATCH |
| `/api/superadmin/email-logs` | `src/app/api/superadmin/email-logs/route.ts` | GET |
| `/api/superadmin/portal-staff/[id]` | `src/app/api/superadmin/portal-staff/[id]/route.ts` | GET, PATCH, DELETE |
| `/api/superadmin/portal-staff` | `src/app/api/superadmin/portal-staff/route.ts` | GET, POST |
| `/api/superadmin/send-email` | `src/app/api/superadmin/send-email/route.ts` | POST |
| `/api/technical-complete` | `src/app/api/technical-complete/route.ts` | POST |
| `/api/track/click` | `src/app/api/track/click/route.ts` | GET |
| `/api/track/open` | `src/app/api/track/open/route.ts` | GET |
| `/api/training-usage` | `src/app/api/training-usage/route.ts` | GET, POST |
| `/api/unsubscribe` | `src/app/api/unsubscribe/route.ts` | GET, POST |
| `/api/user-plan` | `src/app/api/user-plan/route.ts` | GET |
| `/api/users/search` | `src/app/api/users/search/route.ts` | GET |
| `/api/verify-razorpay-payment` | `src/app/api/verify-razorpay-payment/route.ts` | POST |
| `/api/verify/[certificateNumber]` | `src/app/api/verify/[certificateNumber]/route.ts` | GET |