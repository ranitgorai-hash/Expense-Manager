# Expense Manager

A local-first expense tracker PWA, built incrementally per the spec's suggested build order.

## ✅ Done so far — Stage 1 (Local-only Group Mode core)

- Vite + React 18 + TypeScript + MUI v5
- IndexedDB schema via `idb` (`src/db/index.ts`) — sole point of DB access, with a
  change-notification hook (`onDbChange`) ready for the future sync layer to subscribe to.
- Every store from the spec is already created (including the Single Mode ones —
  `budgets`, `recurringExpenses`, `savingsGoals`, `tags`, `receiptImages`, `netWorthSnapshots` —
  so no migration is needed when Stage 3 fills them in).
- Full type definitions (`src/types/index.ts`), including the `mode: 'single' | 'group'`
  field on `Expense` from day one.
- Global app state (`useApp` hook/context) — expenses, friends, categories, settlements,
  settings, current mode, and a `viewFilter` (Combined / Single only / Group only).
- Expense CRUD with Paid By / Paid For, enforcing the spec's rule: if a friend paid, the
  expense is assumed to be for the user (no manual selection); if the user paid, they choose.
- Categories: defaults seeded on first run, full CRUD, tap-through to per-category history.
- Friends: add, soft-deactivate, per-friend balance.
- Settle Up: running balance per friend + recording settlements.
- Friend History: per-day running "who owes whom" totals.
- Combined History/search page: search, date range, category filter, 4 sort orders,
  Combined/Single/Group toggle.
- Analytics (Recharts): 6-month trend, daily spend this month, category pie + top-5 bar.
- Local JSON backup export/import (covers the full dataset).
- Excel export (SheetJS): all-history sheet, personal-expenses sheet, one sheet per friend
  with running balances, Category + Mode columns everywhere.
- Warm orange/green/gold theme, light/dark mode toggle, dark-mode chart tooltip contrast.
- Persistent Mode Switcher in the top bar, mode-aware navigation (Friends / Settle Up /
  Friend History hidden in Single Mode), `mode` field already on every expense.

This is a fully working, deployable app in this state — everything above works 100% offline.

## ✅ Stage 2 (mode field + switcher) — done as part of Stage 1

The `mode` field, `ModeSwitcher`, mode-aware expense entry form, and mode-aware navigation
were all built in from the start rather than retrofitted, per spec §0.

## ✅ Stage 3 (Single Mode exclusives) — done

- **Budgets**: per-category or overall monthly limits, optional rollover, recurring or
  one-off, color-shifting progress bars (green → amber → red), surfaced on both the
  Budgets page and the Dashboard.
- **Recurring Expenses**: weekly/monthly/custom-day schedules, "auto-log on due date" vs.
  "just remind me", upcoming-bills list, 30/90-day cost forecast. Due-today items with
  `autoLog` on are logged automatically once per app open and roll `nextDueDate` forward.
- **Savings Goals**: target amount + optional target date, manual contribution logging,
  progress bar, quick-glance chips on the Dashboard.
- **Tags**: free-form labels independent of category, tag filter added to History, and a
  local-only "reimbursable" flag (a plain status checkbox — not the Group Mode settlement
  engine) on any expense tagged `reimbursable`.
- **Spending Insights**: generated entirely on-device (`utils/insights.ts`, no network
  call) — month-over-month category comparisons, budget-pace warnings, biggest expense
  this week, overall trend. Refreshed on every render from local data.
- **Receipt Capture**: optional photo attached to any Single Mode expense, stored as a
  blob in IndexedDB, never uploaded anywhere.
- **Streaks**: logging streak (consecutive days with an expense logged) shown on the
  Dashboard and Insights page.
- **Net Worth Snapshots**: fully optional, manual account-balance entries with a
  net-worth-over-time line chart, kept separate from expense tracking.
- Excel export now adds a **Budgets** sheet and a **Savings Goals** sheet whenever Single
  Mode data is present, per spec §7.

All of the above is additive and degrades gracefully — none of it appears in Group Mode
nav or dashboard.

## ✅ Stage 4 (PWA wrapper) — done

- `vite-plugin-pwa` configured in `vite.config.ts`: Workbox-generated service worker
  (`autoUpdate`), cache-first app shell so the installed app opens instantly offline.
- Full icon set generated in the brand palette (16 through 512px, plus dedicated
  maskable 192/512 icons and an Apple touch icon) in `public/icons/`.
- Web manifest: name, short name, theme/background colors, `standalone` display,
  portrait orientation — installs on Android, iOS (via Add to Home Screen), and
  desktop Chrome/Edge.
- `PwaUpdatePrompt` component: a "new version ready — Reload" snackbar backed by
  `virtual:pwa-register/react`, an "offline ready" confirmation, and a manual
  Install banner driven by the browser's `beforeinstallprompt` event.
- Runtime caching explicitly excludes `supabase.co` / `googleapis.com` origins, so
  the future sync/Drive-backup network calls are never silently served from cache.
- Verified via `npm run build`: manifest, `sw.js`, and precache manifest (35 entries)
  all generate correctly and the manifest link is injected into `dist/index.html`.

## ✅ Stage 5 (Guided Tour) — done

- `useTour.tsx` (as a `TourProvider` context so Settings and the overlay share state):
  mode-branched step lists, each step defines a real, verifiable completion condition
  (not just "click next") checked against live app/budget data.
  - **Group Mode tour**: add a real friend → create a real Quick Add shortcut → record a
    real split expense.
  - **Single Mode tour**: create a real Quick Add shortcut → set a first budget on one
    category → log a real expense in that category and watch the budget bar move.
- `TourOverlay`: a non-blocking floating card (not a modal) showing the current step,
  progress bar, and a "Go to X" button — the user performs the action for real anywhere
  in the app, and the tour advances automatically once it detects the change.
- Runs once automatically per mode (`settings.tourCompletedGroup` /
  `tourCompletedSingle`), the first time that mode is entered.
- Replayable anytime from **Settings → Replay guided tour**, with a mode picker.
- Added "Save as a Quick Add shortcut" to the expense form (both modes) so the tour's
  Quick Add step has a real action to complete — this is also just a generally useful
  feature on its own.

## 🚧 Not yet built (next stages, in spec order)
7. Supabase auth + cross-device sync (single encrypted blob per account).
8. Real-time collaborative confirmation (notifications inbox) — Group Mode only.
9. Visual polish pass.

## ✅ Stage 6: Google Drive manual backup + optional AES-256-GCM encryption

- **Settings → Google Drive Backup**: "Connect & back up" triggers a Google OAuth consent
  popup (Google Identity Services, no client secret), scoped to `drive.file` — the app can
  only ever see the one backup file it creates, never the rest of your Drive.
- Encryption is **opt-in per backup**, prompted the first time you connect: leave the
  passphrase blank to upload plain JSON, or set one to encrypt with AES-256-GCM
  (key derived via PBKDF2-SHA256, 200,000 iterations, random salt + IV) before anything
  leaves the device. The passphrase itself is never stored anywhere.
- "Restore from Drive" downloads the file and — if it's encrypted — prompts for the
  passphrase before decrypting and importing.
- Requires `VITE_GOOGLE_CLIENT_ID` (see `.env.example`) — a Google Cloud OAuth 2.0 Web
  Client ID with your deployed origin in "Authorized JavaScript origins". Without it, the
  Settings page shows a graceful "not configured" message and everything else keeps
  working fully offline.
- New files: `src/utils/crypto.ts` (encryption), `src/utils/drive.ts` (Drive API + auth).

## ⚠️ Fixed: blank white screen on `npm run dev`

If you pulled an earlier copy of this project and saw a blank white screen after
`npm install && npm run dev`: the root cause was **Vite 8's new Rolldown-based bundler**,
which has a CJS/ESM interop bug with `@mui/icons-material` — every icon import silently
resolved to the wrong object, so React threw "Element type is invalid" on first render
and nothing painted. This is fixed by pinning `vite` to the stable v5 line
(`vite@^5.4.21` + `@vitejs/plugin-react@^4.7.0`), which this project now uses.
If you still see it, delete `node_modules/.vite` and restart the dev server.

## Getting started

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Copy `.env.example` to `.env` and fill in values once Stages 6-8 are implemented — until
then the app runs entirely offline with zero network calls, by design.
