# Budget Signal

Budget Signal is split into two stacks: a Node API for persistent data and statement processing, and an Angular 21 SPA for the UI. The app tracks two manual budget flows with a compact two-column top dashboard summary, plus a separate statement import and analysis view.

## Requirements

Use Node 22 for local development. This repo includes `.nvmrc`.

```bash
nvm use
npm install
```

Angular 21 requires Node `^20.19.0 || ^22.12.0 || >=24.0.0`.

## Run

Start the backend API in one terminal:

```bash
npm run start:api
```

Start the Angular SPA in another terminal:

```bash
npm start
```

Open `http://127.0.0.1:4200/` or `http://localhost:4200/`. The Angular dev server proxies `/api` to `http://127.0.0.1:3000`.

## Build And Test

```bash
npm run build
npm run test:server
npm test -- --watch=false --browsers=ChromeHeadless
npm run test:all
```

## Docker / Portainer

The production Docker shape uses two independently deployed services from the same repository:

- `web`: builds and serves the Angular SPA through Nginx on port `4210`.
- `api`: runs the Node API on port `8734` and stores persistent JSON data in `/data`.

The Angular web container proxies `/api` requests to the API service, so the web app can keep using same-origin `/api/...` calls while the API remains directly reachable on port `8734` for other web or mobile clients.

Build and run locally:

```bash
docker compose up --build -d
curl http://127.0.0.1:8734/api/health
curl http://127.0.0.1:4210/api/health
```

Open `http://127.0.0.1:4210/` for the Angular web app. API clients can call `http://127.0.0.1:8734/api/...` directly.

### Use It In Portainer

Create a Portainer Stack from this repository:

1. Go to `Stacks`.
2. Click `Add stack`.
3. Name it `budget-signal`.
4. Choose `Repository`.
5. Enter the repository URL.
6. Set the compose path to `docker-compose.yml`.
7. Add the Stack environment variables below.
8. Click `Deploy the stack`.

Set these Stack environment variables in Portainer:

```env
RESEND_API_KEY=re_...
BUDGET_SUMMARY_EMAIL_TO=email1@example.com,email2@example.com
BUDGET_SUMMARY_EMAIL_FROM=VD Presupuesto <budget@yourdomain.com>
BUDGET_SUMMARY_EMAIL_SUBJECT_PREFIX=VD Presupuesto
CORS_ORIGIN=https://budget.yourdomain.com
BUDGET_SIGNAL_ACCESS_CODE=0607
```

For a direct IP deployment without a domain, `CORS_ORIGIN=*` is fine. For production with separate web and API domains, set it to the exact web app URL, for example `https://budget.yourdomain.com`.

The app starts locked on every page load or refresh. The fixed four-number access code is `0607`; the API also requires that code through the web app's request header for every endpoint except `/api/health`. If you later change `BUDGET_SIGNAL_ACCESS_CODE`, update the web access-code service to match before rebuilding.

After the stack starts, open:

```text
http://YOUR_SERVER_IP:4210
```

The API is directly reachable at:

```text
http://YOUR_SERVER_IP:8734/api/health
```

The same API health check should also work through the web container proxy at:

```text
http://YOUR_SERVER_IP:4210/api/health
```

`BUDGET_SUMMARY_EMAIL_TO` accepts comma-separated or semicolon-separated recipients. The compose file mounts the named volume `budget-signal-data` to `/data`; keep that volume when recreating the container so app data survives image updates. Do not delete the volume unless you want to reset the app data.

To update the app after pushing changes, use Portainer's `Pull and redeploy` or `Update the stack` action and keep the existing `budget-signal-data` volume.

If Portainer cannot build directly from your Git repository, build and push the two images from your machine, then change the `api.image` and `web.image` values in the stack to your registry images:

```bash
docker build --target api -t your-registry/budget-signal-api:latest .
docker build --target web -t your-registry/budget-signal-web:latest .
docker push your-registry/budget-signal-api:latest
docker push your-registry/budget-signal-web:latest
```

For a domain, point the web reverse proxy to `4210`. If you want a public API domain for other clients, point that API reverse proxy to `8734`. The API health check is available at `/api/health` on both surfaces.

## Cross-Platform Web And PWA

The Angular app uses `apps/web/src/environments/environment.ts` for the web build. Its `apiBaseUrl` is empty, so browser and PWA installs keep calling same-origin `/api/...` through the web container proxy.

The iOS-oriented web build uses `apps/web/src/environments/environment.ios.ts`. Before building a Capacitor shell later, replace the placeholder `https://api.budget.example.com` with your deployed HTTPS API origin. Do not include `/api` in that value.

Build commands:

```bash
npm run build
npm run build:ios
```

The production web build includes a PWA manifest and Angular service worker. The service worker caches app shell/static assets only; API responses are not cached, so backend data remains the source of truth.

To install on iPhone as a PWA:

1. Open your HTTPS web URL in Safari.
2. Use Share -> Add to Home Screen.
3. Launch Budget Signal from the home screen icon.

## Structure

- `apps/api/src/index.mjs` is the Node HTTP API.
- `apps/api/src/store.mjs` owns app-state normalization, manual budgets, conversion budget data, statement imports, duplicate detection, and budget threshold persistence.
- `apps/api/src/persistence` owns the versioned JSON data store, schema migrations, atomic writes, backups, and persistence tests.
- `apps/api/src/presupuesto-summary-engine.mjs` generates the Spanish `Presupuesto` dashboard verdict from backend budget data and Dominican economic context.
- `apps/api/src/balance-payment-summary-engine.mjs` generates the Spanish `Balance de Pago` verdict from the final payment result and coverage signals.
- `apps/api/src/wealth-summary-engine.mjs` generates the Spanish `Patrimonio` verdict, score dimensions, benchmarks, stress tests, action plan, and source-backed financial analysis from assets, debts, liquidity, leverage, investment exposure, DOP/USD exposure, and researched financial resilience metrics.
- `apps/api/src/email` composes the budget summary email template and sends it through Resend.
- `apps/api/src/statement-parser.mjs` parses generic CSV, Banco Popular text statements, and CreditCardMovementsDetail CSV exports.
- `apps/api/data/app-state.json` is the development JSON store; deployed servers should point `BUDGET_SIGNAL_DATA_FILE` or `BUDGET_SIGNAL_DATA_DIR` to a persistent path outside the app release folder.
- `apps/web/proxy.conf.json` connects the Angular dev server to the backend API.
- `apps/web/src/app/app.component.*` is the app shell and navigation composition.
- `apps/web/src/app/core/models` contains shared domain types.
- `apps/web/src/app/core/services/api-client.service.ts` is the SPA API client.
- `apps/web/src/app/core/services/personal-budget.service.ts` hydrates and saves the manual monthly income/expense budget through the backend without owning default categories.
- `apps/web/src/app/core/services/conversion-budget.service.ts` hydrates and saves the two-step currency conversion budget through the backend without owning default categories.
- `apps/web/src/app/core/services/wealth-position.service.ts` hydrates and saves the asset/debt portfolio through the backend and renders backend-generated patrimony summaries.
- `apps/web/src/app/core/services/spending-analytics.service.ts` calculates category, merchant, monthly, and budget insights.
- `apps/web/src/app/core/services/budget-store.service.ts` owns UI signals and consumes backend state/import endpoints.
- `apps/web/src/app/features` contains focused UI components for the active manual budget views, statement import, and statement analysis results mounted inside the `Importar` view.

## API Endpoints

- `GET /api/health`
- `GET /api/state`
- `GET /api/personal-budget`
- `PUT /api/personal-budget`
- `GET /api/personal-budget-summary`
- `GET /api/conversion-budget`
- `PUT /api/conversion-budget`
- `GET /api/conversion-budget-summary`
- `GET /api/wealth`
- `PUT /api/wealth`
- `GET /api/wealth-summary`
- `PUT /api/settings/theme`
- `PUT /api/budgets`
- `POST /api/statements/import-text`
- `POST /api/statements/import-files`
- `POST /api/statements/sample`
- `POST /api/budget-summary-email`
- `DELETE /api/statements`

## Budget Summary Email

The dashboard `ENVIAR RESUMEN` button calls the backend email endpoint. The SPA never receives the Resend API key or recipient configuration.

Configure these environment variables before starting the API:

```bash
export RESEND_API_KEY=re_...
export BUDGET_SUMMARY_EMAIL_TO=you@example.com,partner@example.com
export BUDGET_SUMMARY_EMAIL_FROM="Budget Signal <onboarding@resend.dev>"
npm run start:api
```

For local development, you can also create a `.env` file from `.env.example`; the backend loads it automatically and `.gitignore` keeps it out of source control.

`BUDGET_SUMMARY_EMAIL_FROM` is optional and defaults to Resend's onboarding sender for simple testing. Use a verified domain sender when deploying.

## Deployment Persistence

The backend stores source data in a versioned JSON envelope so app updates can add fields, defaults, or persisted sections without resetting user data. Runtime summaries are derived by backend engines and are not stored.

Set the production data file outside the application code directory:

```bash
export BUDGET_SIGNAL_DATA_FILE=/var/lib/budget-signal/app-state.json
npm run start:api
```

For Docker or another process manager, mount `/var/lib/budget-signal` as a persistent volume. The JSON file format is:

```json
{
	"schemaVersion": 2,
	"updatedAt": "2026-05-06T00:00:00.000Z",
	"data": {
		"theme": "dark",
		"budgets": [],
		"personalBudget": {},
		"conversionBudget": {},
		"wealthPortfolio": {
			"assets": [],
			"liabilities": []
		},
		"statements": []
	}
}
```

Before every write, the backend keeps the previous file at `app-state.json.bak`, then writes the new envelope through a temp file and atomic rename. Legacy raw JSON is migrated on read and written back as a versioned envelope on the next mutation. Invalid JSON is rejected with an API error instead of silently resetting to defaults.

## Personal Budget

The app shell shows a simple two-card dashboard summary with the current result for `Presupuesto` and `Balance de Pago`. The `Presupuesto` card also displays a short backend-generated Spanish verdict using the monthly result, savings rate, expense pressure, USD exposure, and Dominican economic anchors. Navigation switches between `Presupuesto`, `Balance`, and `Importar`; statement charts, spending analysis, and transaction tables are displayed only inside the `Importar` view.

The `Presupuesto` view is a manual monthly budget, separate from imported bank statement analysis. The backend supplies income categories, fixed card expense categories, and hidden fixed expense defaults; the SPA renders and edits the API state without owning those default values. Hidden fixed expenses are included in totals and backend summaries, but stay collapsed behind the fixed-expense toggle to keep the editor compact. Any `USD` entry is converted to Dominican pesos at `1 USD = 60 DOP`, so the displayed totals and result are a single DOP budget result. Each budget cycle closes on the 27th; the Budget view shows the remaining-day countdown, and the backend `Presupuesto` summary uses that countdown in its Spanish verdict.

When changing budget inputs, currencies, dashboard result semantics, API response shapes, or Dominican context assumptions, review `apps/api/src/presupuesto-summary-engine.mjs` in the same change so the backend summary keeps matching the app.

The `Balance de Pago` view starts from one amount in `USD` or `DOP`. Before any before-conversion categories are subtracted, the backend calculates a net source amount by subtracting `1.8%` plus `US$7` from the entered amount; when the source currency is `DOP`, the fixed fee is converted at `1 USD = 60 DOP`. The view then subtracts the first backend-configured category group, supports adding/removing custom before-conversion categories, converts the result to Dominican pesos at `1 USD = 60 DOP`, adds an extra after-conversion DOP entry, subtracts the second backend-configured DOP category group, and displays the final result at the end of the after-conversion panel.

The `Balance de Pago` card and view also display a backend-generated Spanish verdict. It evaluates whether the generated money covers all credit cards and actual month-end expenses; a negative final result means money is still owed, while a positive result means money remains after paying everything.

The `Importar` view exposes the statement import console for uploading or pasting statements, followed by the statement analysis dashboard, charts, spending breakdowns, merchant rankings, and recent transaction table.

## Patrimonio

The `Patrimonio` view tracks money saved, checking accounts, cash, investments, retirement/pension balances, real estate, vehicles, business assets, and debts such as credit cards, mortgages, vehicle loans, personal loans, student loans, business loans, and tax/legal obligations. The SPA only edits the portfolio UI; the backend stores the portfolio and generates the complete summary.

Assets and liabilities support `DOP` and `USD`. The engine converts everything to DOP at `1 USD = RD$60` so the net worth, debt, liquidity, and chart are comparable with the rest of the app. Debt rows also track annual interest rate and monthly payment so the engine can detect expensive debt and debt-payment pressure.

The summary engine evaluates and returns:

- Net worth: total assets minus total liabilities.
- Liquidity months: cash, checking, and savings divided by monthly expenses from `Presupuesto`.
- Emergency reserve gaps for 3-month and 6-month targets.
- Debt-to-asset ratio: total debt divided by total assets.
- Debt-payment-to-income ratio: monthly debt payments divided by monthly income from `Presupuesto`.
- High-cost debt balance, weighted average debt rate, non-mortgage debt, and annual interest-cost proxy.
- Productive capital share: investments, retirement/pension, and business assets divided by total assets.
- Real asset share, liquid share, largest-position concentration, and diversification pressure.
- Concentration risk: largest asset position divided by total assets.
- Currency mismatch: USD debt compared with USD assets.
- Inflation drag on liquid assets using the Dominican inflation reference encoded in the backend.
- Financial independence progress against a 25x annual-expense target.
- Score dimensions for solvency, liquidity, debt-payment pressure, debt cost, productive capital, diversification, currency exposure, and monthly cash flow.
- Stress tests for 3-month and 6-month emergencies, market drawdown, real-asset haircut, DOP/USD shock, inflation drag, interest-rate shock, and high-cost-debt payoff.
- Benchmarks comparing the portfolio to local and global anchors such as emergency fund thresholds, debt ratios, BCRD inflation context, Findex emergency-money access, and Dominican wage/canasta references.
- A prioritized action plan that changes by case, such as attacking expensive debt, completing a 3-month reserve, reducing monthly debt pressure, covering USD mismatch, automating productive capital, or reducing concentration.

The research anchors encoded in `apps/api/src/wealth-summary-engine.mjs` include World Bank Global Findex 2025 financial inclusion, formal saving, and emergency resilience metrics; CFPB emergency fund and financial well-being guidance; Federal Reserve SHED household financial well-being modules; FDIC Money Smart banking/credit/savings education; SEC Investor.gov diversification framing; IMF Global Financial Stability Report and World Economic Outlook risk framing for debt, volatility, FX, inflation, and tighter financial conditions; BIS uncertainty and financial-system stability context; BCRD inflation/IPC/canasta data categories; BCRD exchange-rate, survey, volume, and volatility references; BCRD monetary/financial sector rates and credit references; BCRD ENGIH household income/expense context; BCRD ENCFT labor/income/formality context; DGII tax, vehicle, and exchange-rate statistics; and local wage/pension/banking references where available. These sources are not fetched at runtime; the app keeps a deterministic local engine with source references embedded in the backend summary context.

## Statement Formats

Supported now:

- Generic CSV with headers such as `Date`, `Description`, `Amount`, `Category`, and `Account`.
- Banco Popular text exports with masked card, `DD/MM`, amount, `CR`/`DB`, and merchant fields.
- CreditCardMovementsDetail CSV exports with a `Movimientos de la tarjeta` section and separate `Pesos` and `Dólares` spend columns.

For Banco Popular exports, `CR` rows are spending and `DB` rows are treated as payments, rebates, or credits.

For CreditCardMovementsDetail exports, positive `Pesos` values are imported as `DOP`, positive `Dólares` values are imported as `USD`, and negative/payment rows are skipped.

Statement imports are accumulative. Parsed statement records are saved by the Node backend in `apps/api/data/app-state.json` during local development and restored on reload; duplicate transactions are skipped across stored statements.

Transaction origin labels come from each format's trusted statement source: generic CSV and Banco Popular use the pasted label or uploaded file name, while CreditCardMovementsDetail uses the second row's second and third columns joined together. CSV `Account`, `Card`, or `Source` columns are not used as the statement origin.
