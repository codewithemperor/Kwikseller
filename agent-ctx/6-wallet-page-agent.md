---
Task ID: 6
Agent: Wallet Page Agent
Task: Build complete wallet/payouts page with balance, transactions, withdrawals

Work Log:
- Created `apps/vendor/src/stores/vendor-wallet-store.ts` — Zustand store with wallet balance, transactions, withdrawal, and refresh methods
- Built complete `apps/vendor/src/app/dashboard/wallet/page.tsx` replacing placeholder with full-featured wallet page
- Implemented flat design: NO card containers, NO shadows, NO rounded-xl/2xl, 1px dividers for visual separation
- Added Balance Overview section with Available Balance, Pending Escrow, and Total Lifetime Earnings
- Added Transaction History section with type/status filter dropdowns, desktop table + mobile card views, flat colored status text, pagination
- Added Saved Bank Accounts section with localStorage persistence, set default toggle, delete functionality
- Added Withdrawal Modal via AppModal with amount input (max button), bank dropdown (paymentsApi.getBanks), account verification (paymentsApi.verifyAccount), auto-fill account name, processing time note
- All API calls gracefully handled with try/catch — works offline with loading/error states
- Verified TypeScript compilation: no new errors introduced

Stage Summary:
- Key files created:
  - `apps/vendor/src/stores/vendor-wallet-store.ts` — Zustand store for wallet state
  - `apps/vendor/src/app/dashboard/wallet/page.tsx` — Complete wallet page (replaces placeholder)
- Resolves Priority 2 item #5: "Wallet Page — Real balance, transactions, withdrawal form with bank verification"
- Known issues: API backend not running, so wallet will show error/loading states until backend is available
