# Budget Signal Plan

Last updated: May 17, 2026

## Product Goal

Build a mobile-friendly budgeting system split into a Node backend stack for persistent data, statement processing, and financial summary engines, plus an Angular SPA stack for the UI. The SPA tracks manual budget flows, a net-worth/wealth position, and statement import/analysis with compact switchable views.

## UI Direction

- Use the provided Nothing-inspired skill: monochrome structure, data-first hierarchy, flat surfaces, segmented progress bars, and precise typography.
- Required Google Fonts: Doto for hero numbers, Space Grotesk for body/UI, and Space Mono for labels and numeric data.
- Support dark and light modes in the app, with OLED dark as the initial mode and an explicit toggle.

## MVP Scope

- Angular 21 standalone SPA scaffolded at the workspace root.
- Node backend API with versioned, migration-ready JSON-backed data storage.
- SPA consumes `/api` endpoints for app state, manual budget persistence, conversion budget persistence, theme/budget threshold persistence, statement import, sample data, and clearing statements.
- Top dashboard summary showing only the current result for `Presupuesto` and `Balance de Pago`, with short backend-generated Spanish verdicts for both results.
- Dashboard action for sending the current backend-generated budget summary email through Resend.
- `Presupuesto` view for manually editing backend-provided monthly incomes, fixed card/payment expense categories, hidden fixed expense defaults, custom expense categories, a 27th-of-month cycle countdown, and one DOP income minus expenses result after converting any USD entry at `1 USD = 60 DOP`.
- `Balance de Pago` view for starting from a `USD` or `DOP` amount, calculating a net source amount after `1.8%` plus `US$7`, subtracting a first category group with custom before-conversion categories, converting the remainder to Dominican pesos at `1 USD = 60 DOP`, adding an extra after-conversion DOP entry, subtracting a second DOP category group, and showing the final important result at the bottom of the after-conversion panel.
- `Patrimonio` view for assets, cash, accounts, savings, investments, retirement/pension, real estate, vehicles, business assets, mortgages, cards, loans, and tax/legal debts.
- Backend `Patrimonio` engine that returns Spanish net-worth analysis, score dimensions, diagnostics, stress tests, benchmarks, action plan, and source-backed RD/global context while the SPA remains UI-only.
- `Importar` view for uploading or pasting statements and reviewing statement analysis results.
- Statement analysis components and services remain scoped to the `Importar` view, while the top manual dashboard stays limited to two result cards.
- Mobile layout with bottom navigation and touch-friendly controls.

## App Structure

- `server/index.mjs` exposes the REST API.
- `server/store.mjs` owns persisted state normalization, validation, duplicate detection, and import application.
- `server/persistence` owns schema-versioned JSON reads/writes, migrations, atomic file replacement, and previous-file backups.
- `server/presupuesto-summary-engine.mjs` owns the smart monthly `Presupuesto` verdict, combining the net result, savings rate, expense pressure, USD exposure, and Dominican economic context.
- `server/balance-payment-summary-engine.mjs` owns the smart `Balance de Pago` verdict, evaluating whether generated money covers credit cards and actual end-of-month expenses.
- `server/wealth-summary-engine.mjs` owns the smart `Patrimonio` verdict, score dimensions, liquidity/debt/investment/currency metrics, stress tests, benchmarks, and embedded research context.
- `server/budget-summary-email.mjs` owns email composition and Resend delivery using backend environment variables.
- `server/statement-parser.mjs` owns CSV, Banco Popular text, and CreditCardMovementsDetail parsing.
- `server/defaults.mjs` owns backend defaults and sample statement content.
- `proxy.conf.json` proxies Angular dev-server `/api` calls to the Node API.
- `src/app/core/models` holds shared statement, budget, insight, and import summary types.
- `src/app/core/services/api-client.service.ts` owns SPA HTTP calls to the backend.
- `src/app/core/services/spending-analytics.service.ts` owns derived spending, merchant, monthly, and budget calculations.
- `src/app/core/services/budget-store.service.ts` owns UI signals and backend state/import consumption.
- `src/app/core/services/personal-budget.service.ts` owns the independent manual monthly budget UI state and backend persistence calls.
- `src/app/core/services/conversion-budget.service.ts` owns the independent two-step conversion budget UI state and backend persistence calls.
- `src/app/core/services/wealth-position.service.ts` owns the `Patrimonio` UI state and backend persistence calls without calculating wealth summaries in the SPA.
- `src/app/features` holds focused UI components for personal budget, conversion budget, dashboard, spending analysis, import, and transactions; the app shell mounts the personal budget, conversion budget, and import/analysis views.
- `src/app/app.component.*` is now only the app shell and navigation composition.

## Data Assumptions

- CSV statements can include headers such as Date, Description, Amount, Category, and Account.
- Banco Popular text exports include masked card, `DD/MM`, amount, `CR`/`DB`, and merchant fields.
- `CR` rows are treated as spend; `DB` rows are treated as payments, rebates, or credits and excluded from spend analysis.
- CreditCardMovementsDetail CSV exports include a `Movimientos de la tarjeta` section with separate `Pesos` and `Dólares` columns.
- Positive `Pesos` movements are tracked as `DOP`; positive `Dólares` movements are tracked as `USD`; negative/payment movements are excluded from spend.
- Banco Popular `DD/MM` rows are assigned to the current year because the export does not include a year in each transaction row.
- Negative credit card charges and parenthesized amounts are treated as spend by absolute value.
- Statement imports accumulate into backend JSON storage and are restored through `GET /api/state` on reload.
- Persisted JSON is stored as a `schemaVersion` envelope; legacy raw JSON is migrated on read, new defaults/properties are filled by normalizers, and invalid JSON fails loudly instead of resetting user data.
- Statement origin labels come from trusted statement context: generic CSV and Banco Popular use the pasted label or uploaded file name; CreditCardMovementsDetail uses the second row's second and third columns joined together.
- Payment, autopay, refund, deposit, payroll, and transfer rows are ignored.
- Missing categories are inferred from merchant names using local heuristics, including Spanish and Dominican merchant patterns.
- Personal budget entries are manual and independent from imported statement data; the Node backend owns default categories and hidden fixed expense defaults, the SPA renders API state only, hidden fixed expenses are included in totals/summaries even when collapsed in the UI, and all USD values are converted into the DOP result at `1 USD = 60 DOP`.
- Personal budget summaries are generated only in the backend and use user-provided result bands: negative means debt, `RD$100k+` is strong saving capacity, `RD$50k+` is good, `RD$20k+` is barely healthy, and lower positive values are fragile.
- Personal budget cycles close on the 27th of each month; before or on the 27th the active cycle ends that month, after the 27th it ends on the 27th of the next month. The backend summary message uses the remaining-day countdown.
- Any future app change that affects budget inputs, currencies, dashboard result semantics, API response shape, or Dominican context must include a review/update of `server/presupuesto-summary-engine.mjs` when needed.
- The summary engine uses a DR context snapshot from public sources: BCRD exchange/inflation indicators and Ministerio de Trabajo 2026 minimum wage/canasta coverage references.
- Conversion budget entries are manual and independent from imported statement data; custom rows can be added to the before-conversion group, one extra DOP entry can be added after conversion, the source amount used for calculations is net of `1.8%` plus `US$7`, and the conversion rate is fixed at `1 USD = 60 DOP`.
- Balance summaries are generated only in the backend and use the final DOP result: negative means money is still owed; positive means money remains after paying cards and expenses.
- Any future app change that affects payment balance inputs, currency conversion, final result semantics, or API response shape must include a review/update of `server/balance-payment-summary-engine.mjs` when needed.
- Budget summary emails are sent only by the backend through Resend; the SPA triggers `POST /api/budget-summary-email` and never handles email secrets or recipient configuration.
- Wealth portfolio entries are manual and independent from imported statement data; the Node backend owns storage and all summary calculations.
- Wealth summaries use fixed `1 USD = 60 DOP`, monthly income/expenses from `Presupuesto`, and portfolio assets/liabilities to calculate net worth, emergency reserve gaps, high-cost debt, weighted average debt rate, non-mortgage debt, productive asset share, real asset share, concentration, USD mismatch, inflation drag, financial independence progress, and stress scenarios.
- Wealth engine research anchors include World Bank Global Findex, CFPB emergency fund and financial well-being guidance, Federal Reserve SHED, FDIC Money Smart, SEC diversification framing, IMF GFSR/WEO, BIS annual report context, BCRD inflation/exchange-rate/financial-sector/ENGIH/ENCFT references, DGII statistics, local wage references, and Budget Signal budget data.
- Any future app change that affects wealth portfolio inputs, currencies, debt semantics, monthly budget linkage, API response shape, or RD/global context must include a review/update of `server/wealth-summary-engine.mjs` and its tests.

## Next Phases

- Add account-level filters and monthly period controls.
- Add recurring charge detection with month-over-month comparison.
- Add account-level statement management endpoints for deleting individual stored imports.
- Add statement-period year detection from document metadata if future text exports include it.
- Add richer CSV mappings for banks with separate debit and credit columns.
- Add exportable budget reports.