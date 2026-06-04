---
Task ID: 11
Agent: KYC Backend Agent
Task: Build KYC Backend Module (11D) + API Client Updates + Register Fix

Work Log:
- Examined existing NestJS module patterns (notifications, subscriptions, admin-users controllers)
- Reviewed Prisma schema for KycDocument, KycStatus, KycDocumentType, Store, VerificationStatus models
- Created `apps/api/src/modules/kyc/kyc.controller.ts` — Vendor KYC controller with 3 endpoints:
  - GET /vendor/kyc/status — Returns KYC documents, computed overall status, and rejection reasons
  - POST /vendor/kyc/submit — Validates and creates KycDocument records, updates store status to PENDING_REVIEW
  - GET /vendor/kyc/submissions — Returns all KYC submission history for the vendor
- Created `apps/api/src/modules/kyc/kyc-admin.controller.ts` — Admin KYC controller with 3 endpoints:
  - GET /admin/kyc/pending — Paginated list of pending KYC submissions with user/store info
  - POST /admin/kyc/:id/approve — Approves document, auto-approves store when all docs approved
  - POST /admin/kyc/:id/reject — Rejects document with required reason, updates store status
- Created `apps/api/src/modules/kyc/kyc.module.ts` — NestJS module wiring both controllers
- Updated `apps/api/src/app.module.ts` — Added KycModule import and registration
- Updated `packages/api-client/src/index.ts` — Added `kycApi` (getStatus, submitKyc, getSubmissions) and `onboardingApi` (getStatus, completeStep, complete) sections
- Fixed register page bug in `apps/vendor/src/components/auth/register-page.tsx`:
  - Added STORE_CATEGORIES constant with 12 categories
  - Added store category dropdown (native <select>) between store name and password fields
  - Changed hardcoded `storeCategory: "other"` to use form value `data.storeCategory || "other"`
  - Added `storeCategory: "other"` to form default values
  - Added `storeCategory: z.string().optional()` to registerSchema in @kwikseller/types
- TypeScript compilation passed with zero errors (`npx tsc --noEmit` clean)
- ESLint passed for all new KYC module files

Stage Summary:
- KYC backend module fully implemented with vendor-facing and admin-facing endpoints
- Vendor endpoints: status check, document submission with transaction, submission history
- Admin endpoints: paginated pending list, approve/reject with store status auto-update
- API client updated with kycApi and onboardingApi for frontend consumption
- Register page bug fixed: store category now selectable from dropdown instead of hardcoded "other"
- All new code follows existing NestJS patterns (guards, decorators, Prisma service injection)
