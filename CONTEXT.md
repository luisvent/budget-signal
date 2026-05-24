# Budget Signal — Source of Truth

Last updated: May 24, 2026

This single document supersedes `PLAN.md`, `FOLLOW.md`, `CROSS_PLATFORM_DEPLOYMENT_PLAN.md`, and the architecture sections of `README.md`. It captures product intent, architecture, domain rules, file map, API contract, build/test/deploy, cross-platform delivery, decisions, and open items. Update this file whenever any of those areas change.

---

## 1. Product

Budget Signal is a personal, mobile-first budgeting product for one household, focused on the Dominican Republic context (DOP/USD).

### 1.1 Primary surfaces

1. **Dashboard** — compact, monochrome shell. Two top result cards (`Presupuesto`, `Balance de Pago`) on desktop. On mobile the dashboard summary is hidden so only the active view is visible.
2. **Presupuesto** — manual monthly income/expense budget with a 27th-of-month cycle countdown. USD entries convert at `1 USD = 60 DOP`. Hidden fixed expenses are included in totals but collapsed in the editor.
3. **Balance de Pago** — two-step conversion budget: source USD or DOP → net of `1.8% + US$7` fee → minus before-conversion category group → convert to DOP at `60 DOP/USD` → plus an after-conversion DOP addition → minus after-conversion DOP category group → final DOP result.
4. **Patrimonio** — net-worth and resilience: assets, debts, score dimensions, stress tests, benchmarks, source-backed action plan. All summary math lives in the backend.
5. **Importar** — statement upload/paste + statement analysis (charts, spending, merchants, recent transactions). The dashboard summary stays limited to the two result cards; all statement analysis is scoped to this view.

### 1.2 Behavioral requirements

- Mobile-first; layouts validated at iPhone widths (390×844). Mobile UI hides the dashboard summary, shows a bottom `ENVIAR RESUMEN` block, and uses a floating bottom nav.
- iOS PWA: opaque black status bar (`apple-mobile-web-app-status-bar-style=black`), no pinch zoom (`user-scalable=no`), no overscroll rubber-band (`overscroll-behavior: none`, `touch-action: pan-y`).
- Dark mode default; light mode toggle currently hidden.
- All money-bound inputs are formatted with thousand separators via the `appMoneyInput` directive. Inputs use `type="text" inputmode="decimal"` so the mobile numeric keypad still appears.
- Access lock: app starts locked on every load; fixed 4-digit code (`0607`) stored as `BUDGET_SIGNAL_ACCESS_CODE`. The code auto-submits when the 4th digit is entered and is persisted in `localStorage` for 24 h so it isn't asked again during the same day. The API requires the code via the `X-Budget-Signal-Code` header on every endpoint except `/api/health`.

### 1.3 UI direction

- Nothing-inspired skill (see `skills/nothing-design/`): monochrome, data-first, flat surfaces, segmented progress bars, precise typography.
- Fonts: **Doto** (hero numbers), **Space Grotesk** (body/UI), **Space Mono** (labels, numeric data).
- Component-style budget for `app.component.scss`: 28 kB warning / 40 kB error. Keep new mobile CSS lean.

---

## 2. Architecture

Two independent stacks in one repo:

```
budget-signal/
├── apps/
│   ├── api/   # Node 22 HTTP API, business logic, persistence
│   └── web/   # Angular 21 SPA, UI only
├── skills/    # Authoring + design skills (Angular, Nothing design)
└── credit card statements/  # Sample statements for local testing
```

### 2.1 Backend (Node, `apps/api/src/`)

| File | Owns |
| --- | --- |
| `index.mjs` | HTTP server, request routing, access-code enforcement, JSON I/O. |
| `store.mjs` | App-state normalization, validation, duplicate detection, import application, persistence calls. |
| `defaults.mjs` | Default categories, fixed/hidden expense defaults, sample statement content. |
| `env.mjs` | Environment variable loader (also reads `.env` for local dev). |
| `presupuesto-summary-engine.mjs` | Spanish `Presupuesto` verdict (net result + savings rate + expense pressure + USD exposure + DR context). |
| `balance-payment-summary-engine.mjs` | Spanish `Balance de Pago` verdict (whether generated money covers cards + actual month-end expenses). |
| `wealth-summary-engine.mjs` | `Patrimonio` engine: net worth, score dimensions, liquidity/debt/investment metrics, stress tests, benchmarks, action plan, source-backed research context. |
| `statement-parser.mjs` | Generic CSV + Banco Popular text + CreditCardMovementsDetail CSV parsing. |
| `email/budget-summary-email.mjs` | Resend email composition + delivery. |
| `email/budget-summary-template.mjs` | Email HTML/text template. |
| `persistence/json-store.mjs` | Versioned JSON envelope reads/writes, serialized updates. |
| `persistence/migrations.mjs` | Schema migration pipeline. |
| `persistence/schema.mjs` | Schema declarations + defaults. |

Tests: `*.test.mjs` files alongside the modules. Run with `npm run test:server` (Node's built-in test runner).

### 2.2 Frontend (Angular 21, `apps/web/src/app/`)

Standalone components + signals. No NgModules. No Router beyond the shell-level `app.routes.ts` (single-view shell with internal `activeView` signal).

| Path | Owns |
| --- | --- |
| `app.component.{ts,html,scss}` | App shell, navigation composition, access lock, mobile/desktop layout, mobile email block. |
| `app.config.ts` | Standalone providers, service-worker registration (production only). |
| `app.routes.ts` | Single-route shell. |
| `core/models/` | Shared statement, budget, insight, import summary, currency types. |
| `core/services/api-client.service.ts` | Centralized HTTP client; resolves URL via `environment.apiBaseUrl`. Adds `X-Budget-Signal-Code` header. |
| `core/services/access-code.service.ts` | Validates code, persists `{code, expiresAt}` in `localStorage` for 24 h. |
| `core/services/budget-store.service.ts` | UI signals, backend state hydration, theme, statement imports, email trigger. |
| `core/services/personal-budget.service.ts` | Manual monthly budget state + persistence. Defaults owned by backend. |
| `core/services/conversion-budget.service.ts` | Two-step conversion budget state + persistence. |
| `core/services/wealth-position.service.ts` | Portfolio state + persistence. No calculations — backend summary is rendered as-is. |
| `core/services/spending-analytics.service.ts` | Derived category/merchant/monthly/budget calculations for imported statements. |
| `features/personal-budget/` | `Presupuesto` view. |
| `features/conversion-budget/` | `Balance de Pago` view. |
| `features/wealth/` | `Patrimonio` view. |
| `features/import/` | Statement importer. |
| `features/dashboard/` | Dashboard summary, charts, insight grid for the `Importar` view. |
| `features/spending/`, `features/transactions/` | Analysis views inside `Importar`. |
| `shared/budget-pressure-bar.component.ts` | Segmented pressure bar. |
| `shared/money-input.directive.ts` | `ControlValueAccessor` for money inputs (thousand separators, en-US format, caret preservation). |

Environment files:

- `environments/environment.ts` — web build. `apiBaseUrl: ''` (same-origin `/api/...`).
- `environments/environment.ios.ts` — iOS Capacitor build. Replace placeholder with deployed HTTPS API origin before building. **Do not include `/api`** in that value.

### 2.3 Local dev wiring

- API on `127.0.0.1:3000`.
- Angular dev server on `localhost:4210` (was 4200; `npm start` already passes `--port 4210` when invoked through the dev terminal pattern). The dev server proxies `/api` to the API through `apps/web/proxy.conf.json`.
- Node version: **22.22.2** (Angular 21 minimum: `^20.19.0 || ^22.12.0 || >=24.0.0`). `.nvmrc` is checked in. Always `source ~/.nvm/nvm.sh && nvm use` before running scripts; Node 20.12.x is below Angular CLI's minimum and will fail.

---

## 3. Domain rules

### 3.1 Currency

- Single fixed rate everywhere: `1 USD = 60 DOP`. Any change must update all engines and the SPA UI together.
- Balance de Pago fee: source amount becomes `source - 1.8% - US$7` before any deductions. When source currency is DOP, the `US$7` fee is converted at `60 DOP/USD`.

### 3.2 Presupuesto

- Backend owns default income categories, fixed card/payment expense categories, and a hidden-fixed expense set (Papi, Dientes Lea, Ahorro, Maestria, Apt Puerto Plata, Prestamo APT, Mantenimiento APT, Ahorro Rullios, Facturas). Hidden fixed expenses count in totals + summary, but are collapsed in the editor.
- USD entries are converted into the single DOP result.
- Cycle closes on the **27th** of each month. Before/on the 27th → current cycle ends this month; after the 27th → ends on the 27th of the next month. The backend summary uses the remaining-day countdown.
- Summary result bands (used by `presupuesto-summary-engine.mjs`):
  - Negative → debt.
  - `RD$100k+` → strong saving capacity.
  - `RD$50k+` → good.
  - `RD$20k+` → barely healthy.
  - Lower positive → fragile.
- DR economic context anchors: BCRD exchange/inflation indicators, Ministerio de Trabajo 2026 minimum wage, canasta coverage.

### 3.3 Balance de Pago

- Pipeline: source (USD or DOP) → net of `1.8% + US$7` → minus backend first category group (with optional user-added rows) → convert to DOP at 60 → plus an after-conversion DOP addition → minus backend second DOP category group → final DOP result.
- Verdict: negative result = money still owed; positive = money remains after paying cards + actual end-of-month expenses.

### 3.4 Patrimonio

- All summary math lives in `wealth-summary-engine.mjs`. The SPA only edits the portfolio and renders the API response.
- Engine outputs:
  - Net worth (assets − liabilities).
  - Liquidity months (cash + checking + savings ÷ monthly expenses from `Presupuesto`).
  - 3-month and 6-month emergency reserve gaps.
  - Debt-to-asset ratio, debt-payment-to-income ratio.
  - High-cost debt balance, weighted average debt rate, non-mortgage debt, annual interest-cost proxy.
  - Productive capital share, real asset share, liquid share, concentration risk.
  - Currency mismatch (USD debt vs USD assets).
  - Inflation drag on liquid assets (DR inflation reference).
  - Financial independence progress (25× annual expenses).
  - Score dimensions: solvency, liquidity, debt-payment pressure, debt cost, productive capital, diversification, currency exposure, monthly cash flow.
  - Stress tests: 3-month and 6-month emergencies, market drawdown, real-asset haircut, DOP/USD shock, inflation drag, interest-rate shock, high-cost-debt payoff.
  - Benchmarks against local + global anchors (BCRD, Findex, CFPB, etc.).
  - Prioritized action plan that changes by case.
- Research anchors encoded deterministically (no runtime fetching): World Bank Global Findex 2025; CFPB emergency fund + financial well-being; Federal Reserve SHED; FDIC Money Smart; SEC Investor.gov; IMF GFSR/WEO; BIS; BCRD inflation/IPC/canasta + FX + ENGIH + ENCFT + monetary/financial sector; DGII statistics; local wage/pension/banking references.

### 3.5 Statement import

Supported formats:

- Generic CSV with headers including `Date`, `Description`, `Amount`, `Category`, `Account`.
- Banco Popular text exports (masked card, `DD/MM`, amount, `CR`/`DB`, merchant).
- CreditCardMovementsDetail CSV with `Movimientos de la tarjeta` section, separate `Pesos`/`Dólares` columns.

Rules:

- `CR` rows = spend; `DB` rows = payment/rebate/credit (excluded from spend).
- Positive `Pesos` → `DOP`; positive `Dólares` → `USD`. Negative/payment rows excluded.
- Banco Popular `DD/MM` rows are stamped with the current year.
- Negative or parenthesized credit-card charges are treated as spend by absolute value.
- Payment, autopay, refund, deposit, payroll, and transfer rows are dropped.
- Categories are inferred from merchant names using Spanish/Dominican heuristics when missing.
- Statement imports accumulate; duplicate transactions are detected and skipped across stored statements.
- Statement origin labels (format-specific): generic CSV / Banco Popular use the pasted label or uploaded file name; CreditCardMovementsDetail uses row 2 column 2 + row 2 column 3 joined.
- CSV `Account`, `Card`, or `Source` columns are not used as the origin label.

---

## 4. Persistence

- JSON envelope written atomically (temp file + rename), previous file kept at `app-state.json.bak`.
- Schema is versioned; legacy raw JSON is migrated on read and rewritten on the next mutation.
- Invalid/corrupt JSON is rejected with an API error rather than silently resetting to defaults. Recovery comes from `.bak` or an external backup.
- Writes are serialized to avoid concurrent corruption.
- Runtime summaries are derived; only source data is persisted.

Envelope shape:

```json
{
  "schemaVersion": 2,
  "updatedAt": "2026-05-06T00:00:00.000Z",
  "data": {
    "theme": "dark",
    "budgets": [],
    "personalBudget": {},
    "conversionBudget": {},
    "wealthPortfolio": { "assets": [], "liabilities": [] },
    "statements": []
  }
}
```

Production data file location is controlled via:

- `BUDGET_SIGNAL_DATA_FILE` (full file path), or
- `BUDGET_SIGNAL_DATA_DIR` (directory; file is created inside it).

Local development uses `apps/api/data/app-state.json`.

---

## 5. API

Base path: `/api`. All endpoints require the `X-Budget-Signal-Code` header except `/api/health`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | Public; used by Docker/load-balancer health checks. |
| GET | `/api/state` | Full app state envelope. |
| GET | `/api/personal-budget` | Manual budget data. |
| PUT | `/api/personal-budget` | Replace manual budget data. |
| GET | `/api/personal-budget-summary` | Backend-generated Spanish `Presupuesto` verdict. |
| GET | `/api/conversion-budget` | Conversion budget data. |
| PUT | `/api/conversion-budget` | Replace conversion budget data. |
| GET | `/api/conversion-budget-summary` | Backend-generated `Balance de Pago` verdict. |
| GET | `/api/wealth` | Portfolio data. |
| PUT | `/api/wealth` | Replace portfolio data. |
| GET | `/api/wealth-summary` | Full `Patrimonio` analysis (analysis sections, score, benchmarks, stress tests, action plan, sources). |
| PUT | `/api/settings/theme` | Persist `dark`/`light`. |
| PUT | `/api/budgets` | Persist budget threshold settings. |
| POST | `/api/statements/import-text` | Import a pasted statement. |
| POST | `/api/statements/import-files` | Import one or more uploaded files. |
| POST | `/api/statements/sample` | Load bundled sample statement. |
| POST | `/api/budget-summary-email` | Trigger the Resend email with the current backend-generated summary. SPA never holds the Resend key or recipients. |
| DELETE | `/api/statements` | Clear all stored statements. |

Future: per-statement deletion endpoint.

---

## 6. Build, test, run

```bash
# Use Node 22
source ~/.nvm/nvm.sh && nvm use

# Install
npm install

# Run API (terminal 1)
npm run start:api

# Run SPA (terminal 2)
npm start                          # uses port from angular.json
npm start -- --host 0.0.0.0 --port 4210   # explicit, recommended

# Build
npm run build                      # web
npm run build:ios                  # iOS Capacitor environment

# Test
npm run test:server                # backend (Node test runner)
npm test -- --watch=false --browsers=ChromeHeadless   # SPA (Karma/Chrome Headless)
npm run test:all                   # both
```

Production build output: `dist/apps/web/`.

Current verified counts: **37/37** Karma specs, **21/21** backend `node --test` specs.

---

## 7. Deployment

### 7.1 Docker shape

Two services, both built from the repo:

- `web` — Nginx serving the Angular build on `4210`. Proxies `/api` to the `api` service.
- `api` — Node API on `8734`. Persists JSON in the `budget-signal-data` named volume mounted at `/data`.

```bash
docker compose up --build -d
curl http://127.0.0.1:8734/api/health
curl http://127.0.0.1:4210/api/health
```

### 7.2 Portainer

Create a stack from the repository, compose path `docker-compose.yml`. **Do not use a pull-only redeploy** — `budget-signal-web` and `budget-signal-api` are not public images; the compose file builds them locally. If Portainer cannot build from Git, push your own images and replace `api.image` / `web.image` in the stack.

Required stack environment variables:

```env
RESEND_API_KEY=re_...
BUDGET_SUMMARY_EMAIL_TO=email1@example.com,email2@example.com
BUDGET_SUMMARY_EMAIL_FROM=VD Presupuesto <budget@yourdomain.com>
BUDGET_SUMMARY_EMAIL_SUBJECT_PREFIX=VD Presupuesto
CORS_ORIGIN=https://budget.yourdomain.com   # or * for IP-only personal deployment
BUDGET_SIGNAL_ACCESS_CODE=0607
```

`BUDGET_SUMMARY_EMAIL_TO` accepts comma- or semicolon-separated recipients. Keep the `budget-signal-data` volume across redeploys. `BUDGET_SUMMARY_EMAIL_FROM` is optional and defaults to Resend's onboarding sender.

For HTTPS, front Docker with Caddy / Traefik / Nginx Proxy Manager / Cloudflare Tunnel / Portainer-managed routing. Point the web reverse proxy to `4210`; optionally expose `8734` separately for external API clients.

### 7.3 Updates

Update through Portainer's repository-rebuild flow. If `BUDGET_SIGNAL_ACCESS_CODE` changes, update the SPA access-code service to match before rebuilding.

---

## 8. Cross-platform delivery

Two iOS paths, in order:

### 8.1 PWA (recommended, ships now)

1. Deploy `web` behind HTTPS.
2. Open the URL in iPhone Safari.
3. Share → Add to Home Screen.
4. Launch from the home screen icon.

Configured in:

- `apps/web/public/manifest.webmanifest` — installable metadata.
- `apps/web/ngsw-config.json` — caches static app shell; **does not cache `/api`** so financial data stays fresh.
- `apps/web/src/app/app.config.ts` — service worker registered only for production builds.
- `apps/web/src/index.html` — viewport (`width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`), manifest link, theme color, iOS standalone meta (`apple-mobile-web-app-capable=yes`, `mobile-web-app-capable=yes`, `apple-mobile-web-app-status-bar-style=black`).

**Important PWA caveat:** iOS captures the PWA config at install time. After changing meta tags (e.g. status bar style), remove the PWA from the home screen and re-add it to pick up the new config.

### 8.2 Capacitor (later, when a real `.ipa` is needed)

```bash
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/ios
npx cap init "Budget Signal" "com.yourdomain.budgetsignal" --web-dir dist/apps/web/browser
npx cap add ios
```

Suggested scripts:

```json
{
  "build:ios": "ng build --configuration ios",
  "cap:sync:ios": "npm run build:ios && npx cap sync ios",
  "cap:open:ios": "npx cap open ios"
}
```

Capacitor config:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourdomain.budgetsignal',
  appName: 'Budget Signal',
  webDir: 'dist/apps/web/browser',
  server: { cleartext: false },
};

export default config;
```

The iOS build configuration replaces the environment with `environment.ios.ts`, which must point at the deployed HTTPS API origin (no `/api` suffix). The Capacitor app bundles the Angular build and calls the API over HTTPS.

Install locally: connect iPhone → enable Developer Mode → set signing team in Xcode → Run. Free Apple ID works for one device with frequent re-signing; paid Apple Developer account is smoother. TestFlight is for distribution to multiple testers, not the simplest local install.

### 8.3 Decisions

- Do not duplicate summary engines in the iOS app. Backend stays the owner of financial logic, parsing, summaries, and email.
- HTTPS everywhere for iOS.
- Do not bundle a permanent API secret in the Angular/Capacitor build. The access code is a soft personal gate, not a production secret.
- PWA first, Capacitor second. No rewrite to Flutter/React Native/SwiftUI/Ionic.

---

## 9. Security & access

- Soft access gate: 4-digit code (`BUDGET_SIGNAL_ACCESS_CODE`, default `0607`). API enforces it on every endpoint except `/api/health` via the `X-Budget-Signal-Code` header. The SPA persists the validated code in `localStorage` for 24 h (`{code, expiresAt}`) and auto-unlocks when the 4th digit is typed.
- Recommended next steps before exposing outside a trusted network: hashed-password login, signed session tokens, token in secure storage for Capacitor, and CORS restricted to the production web URL instead of `*`.
- Email secrets never leave the backend.

---

## 10. PWA / mobile polish (verified)

- Top safe-area gap removed by switching to opaque `black` status bar style; iOS now owns the status bar zone and the web view starts below it. `.app-shell` no longer adds `env(safe-area-inset-top)` padding at ≤620 px.
- Bottom nav `bottom: calc(2px + env(safe-area-inset-bottom))` so it sits close to the home indicator.
- Dashboard summary hidden at ≤620 px so only the active view renders.
- Bottom-of-page `ENVIAR RESUMEN` block visible only on mobile.
- Pinch zoom disabled via viewport meta (`maximum-scale=1, user-scalable=no`).
- Rubber-band / page-level drag disabled via `overscroll-behavior: none` and `touch-action: pan-y` on `html`/`body`.
- Personal budget mobile separation: the four summary blocks live inside a single outlined card; `GASTOS` and `INGRESOS` ledgers are separate cards below.
- Money inputs use `appMoneyInput` and `type="text" inputmode="decimal"`. Commas are always thousand separators; only `.` is the decimal mark.

---

## 11. Decisions (kept)

- Standalone Angular components + signals for local state.
- Backend owns persistence, parsing, duplicate detection, summaries, email.
- Persist data outside the app release folder (`BUDGET_SIGNAL_DATA_FILE` / `BUDGET_SIGNAL_DATA_DIR`).
- Reject corrupt JSON instead of resetting; recover from `.bak`.
- `Presupuesto`, `Balance de Pago`, `Patrimonio` summaries are backend-only.
- Resend email is backend-only.
- Keep `presupuesto-summary-engine.mjs`, `balance-payment-summary-engine.mjs`, and `wealth-summary-engine.mjs` in sync whenever inputs, currencies, semantics, API shapes, or DR context change.
- Cycle cutoff fixed at day 27; changing it must update countdown UI, summary text, and tests together.
- SPA stays focused on rendering + interaction; defaults live in the backend.
- Statement origin labels are format-specific (see §3.5).
- Imports accumulate; duplicates skipped.
- Personal monthly budget is independent from imported statements and analytics.
- Hidden fixed expenses always count in totals/summaries.
- Conversion budget is independent from imported statements and analytics.
- Wealth portfolio is persisted; wealth math stays in the backend.
- Only `Presupuesto`, `Balance de Pago`, `Patrimonio`, and `Importar` views are mounted; statement charts/spending/transaction analysis live inside `Importar`.
- Default dark mode; light toggle hidden.
- Do not duplicate financial logic on iOS.
- Avoid delegating simple `git status`-style checks to execution subagents in non-git folders.
- TypeScript path aliases: setting `compilerOptions.paths` in a child tsconfig replaces inherited aliases; add carefully or use `.d.ts`/`moduleNameMapper` alternatives for test-only mocks.

---

## 12. Open items

- Confirm additional bank/card statement formats beyond generic CSV, Banco Popular text, and CreditCardMovementsDetail CSV.
- Decide whether budget thresholds remain monthly defaults or become period-aware signals.
- Add controls and endpoints to delete individual stored statements without clearing the entire store.
- Account-level filters and monthly period controls.
- Recurring charge detection with month-over-month comparison.
- Richer CSV mappings for banks with separate debit/credit columns.
- Statement-period year detection from document metadata when text exports include it.
- Exportable budget reports.
- Stronger auth (hashed login, signed tokens, secure storage) before exposing the API beyond a trusted network.

---

## 13. Glossary

- **Cycle close** — the 27th of each month; the active `Presupuesto` cycle ends on the next 27th.
- **Net source amount** — Balance de Pago source minus `1.8% + US$7`.
- **Hidden fixed expense** — `Presupuesto` expense included in totals/summary but collapsed in the editor by default.
- **Manual budget** — `Presupuesto` or `Balance de Pago`; independent from imported statements and analytics.
- **Statement origin** — format-specific label attached to imported rows; never the CSV `Account` / `Card` / `Source` column.
- **Wealth research anchors** — the deterministic set of public-source references embedded in `wealth-summary-engine.mjs`; not fetched at runtime.
