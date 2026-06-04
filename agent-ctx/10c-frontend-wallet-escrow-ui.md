---
Task ID: 10C
Agent: Frontend Wallet Escrow UI Agent
Task: Enhance Wallet Page with Escrow Holdings + Countdown + Dispute UI (Step 10C)

Work Log:
- Read existing files: API client, wallet store, wallet page, format helpers
- Verified UI component availability (AppModal, AppButton, FieldInput, FieldTextarea, FieldSelect, Skeleton)
- Updated `packages/api-client/src/index.ts` — added `getEscrowDetail()` and `openDispute()` to `escrowApi`
- Updated `apps/vendor/src/stores/vendor-wallet-store.ts` — added `EscrowHolding` type, `escrowHoldings`/`escrowLoading` state, and `fetchEscrowHoldings()` action
- Enhanced `apps/vendor/src/app/dashboard/wallet/page.tsx`:
  - Added imports: Lock, AlertTriangle, Eye from lucide-react; FieldTextarea from @kwikseller/ui; escrowApi from @kwikseller/api-client; EscrowHolding type from store
  - Created `formatRelativeTime()` helper for "held since" display (e.g. "2h ago", "3d ago")
  - Created `getEscrowStatusLabel()` and `getEscrowStatusColor()` helpers for semantic status display
  - Created standalone `CountdownTimer` component with `useEffect`/`setInterval(1000)` cleanup pattern, showing hours/minutes/seconds countdown, "Releasing soon..." when expired
  - Added Section 3A "Escrow Holdings" between Balance Overview and Transaction History with:
    - Section header with count badge + "View All" ghost button (scrolls to released holdings)
    - Active holdings table (desktop) / cards (mobile) with order ref link, amount, status, held since, countdown timer, dispute action
    - Released holdings sub-section with max-h-96 scrollable list
    - Empty state with Lock icon + "No pending escrow holdings"
    - Loading skeleton state
  - Added Dispute Modal (AppModal) with: holding info display, reason textarea, evidence URL input, red warning box, Cancel/Submit buttons
  - Added toast notifications on escrow status change (RELEASED, DISPUTED, PENDING_RELEASE)
  - All existing wallet page functionality preserved (balance, transactions, bank accounts, withdrawal)
- Fixed TypeScript syntax error in CountdownTimer state type annotation
- Verified no new TypeScript errors introduced (pre-existing errors in auth pages and sanitized-html.tsx unrelated)

Stage Summary:
- API Client: `escrowApi.getEscrowDetail()` and `escrowApi.openDispute()` added
- Wallet Store: `EscrowHolding` type + `escrowHoldings` state + `fetchEscrowHoldings()` added
- Wallet Page: Full escrow holdings section with flat design (no shadows, 1px borders), responsive desktop/mobile layouts, countdown timer, dispute modal, toast notifications, empty state
- Design constraint honored: zero shadows, no rounded-xl/2xl, no blue/indigo colors, bg-gray-900 primary, ghost text buttons
