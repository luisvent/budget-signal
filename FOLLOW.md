# Budget Signal Follow File

Last updated: May 18, 2026

## Current Status

- [x] Angular app scaffolded with Angular 18 for the installed Node version.
- [x] Angular upgraded to 21.2.11 under Node 22.22.2.
- [x] App refactored into core models, data, services, and feature components.
- [x] Nothing-inspired UI direction selected from the provided workspace skill.
- [x] Required fonts declared and loaded from Google Fonts.
- [x] Main shell changed to a compact two-card dashboard with `Presupuesto`, `Balance de Pago`, and `Importar` views.
- [x] Project split into two stacks: Node backend API and Angular SPA UI.
- [x] Backend persistent JSON store added for app state, manual budgets, conversion budget, budgets/theme, and imported statements.
- [x] JSON persistence refactored into a schema-versioned envelope with migrations, atomic writes, serialized updates, and `.bak` previous-file backups.
- [x] Angular SPA services changed to consume backend `/api` endpoints instead of browser persistence, with budget default data owned by the backend.
- [x] Core statement dashboard, interactive category chart, analysis, import, and ledger components implemented and mounted only in the `Importar` view.
- [x] Personal monthly budget section added at the top with manual income and expense editing.
- [x] Hidden fixed `Presupuesto` expense defaults added for Papi, Dientes Lea, Ahorro, Maestria, Apt Puerto Plata, Prestamo APT, Mantenimiento APT, Ahorro Rullios, and Facturas; they count in totals and can be shown/edited on demand.
- [x] `Presupuesto` monthly cycle countdown added with each cycle closing on the 27th and backend summary messages adjusted for remaining days.
- [x] `Balance de Pago` view added with fixed USD to DOP conversion, custom before-conversion categories, an after-conversion DOP add-on, and final DOP result.
- [x] `Balance de Pago` source amount calculation now uses the entered amount net of `1.8%` plus `US$7` before before-conversion categories and currency conversion.
- [x] Backend `Presupuesto` smart summary engine added with Spanish dashboard verdicts based on net result, savings rate, expense pressure, USD exposure, and Dominican economic context.
- [x] Backend `Balance de Pago` smart summary engine added with Spanish dashboard verdicts based on whether generated money covers credit cards and actual month-end expenses.
- [x] Backend Resend email endpoint added so the dashboard can send the current budget summary without exposing email secrets to the SPA.
- [x] Docker/Portainer deployment added as one container serving the Angular production build and Node API on port `8734` with persistent `/data` storage.
- [x] `Patrimonio` view added for assets, savings, investments, cash, accounts, mortgage/loan/credit-card debts, net worth chart, and editable asset/debt ledgers.
- [x] Backend `Patrimonio` summary engine upgraded with source-backed score dimensions, diagnostics, benchmarks, stress tests, action plan, RD/global context, and deterministic research references.
- [x] `Patrimonio` UI expanded to show analysis sections, score drivers, stress scenarios, benchmarks, source base, and priority plan from the backend.
- [x] Establishment drilldown implemented so clicking a commerce row opens all matching transactions.
- [x] Multi-file statement upload implemented for CSV and Banco Popular text exports.
- [x] CreditCardMovementsDetail CSV import implemented with DOP and USD column handling.
- [x] Parsed statements now append into backend JSON storage instead of replacing the current ledger.
- [x] Statement origins now use format-specific source rules, including CreditCardMovementsDetail row metadata.
- [x] Category rules tuned against the provided credit card statements.
- [x] Production build verified.
- [x] Dev server launched for local review.

## Verification

- `source "$HOME/.nvm/nvm.sh" && nvm use 22 && npm run build` passed on Angular 21.
- `source "$HOME/.nvm/nvm.sh" && nvm use 22 && npm test -- --watch=false --browsers=ChromeHeadless` passed after the API-backed refactor.
- Backend store verification passed with a temporary JSON file: imported a pasted CSV statement, persisted 1 transaction, and skipped the duplicate on a second import.
- Backend summary engine syntax and sample cases passed under Node 22.
- Backend persistence tests passed for versioned envelope writes, backups, legacy raw JSON migration, serialized updates, app-store default hydration, summaries, and corrupt JSON protection.
- Backend Presupuesto cycle tests passed for current-cycle countdown, 27th final day, next-cycle rollover after the 27th, and date-aware Spanish summary text.
- Three-view shell browser check passed: the top dashboard summary stays visible with two result cards, `Presupuesto`, `Balance`, and `Importar` navigation switches the active view, and chart/spending/transaction analysis sections appear inside `Importar`.
- Personal budget browser check passed at desktop and phone widths: manual income/expense edits update the income minus expenses result, custom expense rows can be added, and no form/nav overflow was detected.
- Conversion budget test passed with the net source rule: `$1,000 - 1.8% - $7 = $975`, then `$975 - $150 = $825`, converted to `RD$49,500`, then minus `RD$15,000` for final `RD$34,500`.
- Custom before-conversion category test passed: adding `Seguro USD` with `75` changed the final result from `RD$58,500` to `RD$54,000`; removing it restored `RD$58,500`.
- After-conversion add-on test passed: `$1,000` nets to `$975`, minus `$100` leaves `$875`, converted to `RD$52,500`, plus `RD$6,000`, then minus `RD$10,000` for final `RD$48,500`.
- Browser upload verified after the service/component refactor with 4 real Banco Popular text statement files: 151 charges imported, 12 payment/rebate rows skipped, 0 duplicates.
- Desktop and phone-width screenshots were reviewed; mobile overflow issues were fixed.
- Angular 21 dev server is running under Node 22 at `http://127.0.0.1:4200/`.
- `source "$HOME/.nvm/nvm.sh" && nvm use 22 && npm run test:server` passed after the expanded `Patrimonio` engine assertions.
- `source "$HOME/.nvm/nvm.sh" && nvm use 22 && npm run build` passed after the expanded `Patrimonio` UI and model contract.
- `source "$HOME/.nvm/nvm.sh" && nvm use 22 && npm run test:server` passed with 21 tests after the Balance de Pago net source amount rule.
- `source "$HOME/.nvm/nvm.sh" && nvm use 22 && npm test -- --watch=false --browsers=ChromeHeadless` passed with 30/30 specs after updating the Balance de Pago live calculation tests.
- Live `/api/wealth` smoke check returned the expanded contract with 7 analysis sections, 8 stress tests, 10 benchmarks, 22 source entries, and active action items.
- Node API is running under Node 22 at `http://127.0.0.1:3000/`; Angular dev server remains at `http://127.0.0.1:4200/`.

## Decisions

- Use standalone Angular components and signals for local app state.
- Use the Node backend for persistence, statement parsing, import application, duplicate detection, and saved app state.
- Keep JSON persistence deployable by storing data outside the app release folder through `BUDGET_SIGNAL_DATA_FILE` or `BUDGET_SIGNAL_DATA_DIR`.
- Reject corrupt JSON instead of resetting to defaults; recover from `app-state.json.bak` or an external backup.
- Generate `Presupuesto` dashboard analysis in the backend, not the SPA.
- Generate `Balance de Pago` dashboard analysis in the backend, not the SPA.
- Generate `Patrimonio` net-worth analysis, score, benchmarks, stress tests, source matrix, and action plan in the backend, not the SPA.
- Send budget summary emails from the backend only through Resend using environment variables.
- Keep `server/presupuesto-summary-engine.mjs` in sync whenever app changes affect budget inputs, currencies, dashboard result semantics, API response shape, or Dominican context assumptions.
- Keep the `Presupuesto` cycle cutoff at day 27 unless the user changes the monthly close rule; any change must update backend summary messages and countdown UI/tests together.
- Keep `server/balance-payment-summary-engine.mjs` in sync whenever app changes affect payment balance inputs, currency conversion, final result semantics, or API response shape.
- Keep the Angular SPA focused on rendering, user interaction, file selection, and consuming API state; fixed/default budget data lives in the Node backend.
- Treat statement origin as format-specific metadata: generic CSV and Banco Popular use the pasted label or file name; CreditCardMovementsDetail uses row 2 column 2 plus row 2 column 3.
- Persist parsed statements in backend JSON storage and append new imports while skipping duplicate transactions.
- Persist budget thresholds, the personal monthly budget, conversion budget, and theme through backend endpoints.
- Keep the personal monthly budget independent from imported statement transactions and analytics.
- Keep hidden fixed personal expenses included in totals and backend summaries even while collapsed in the UI.
- Persist the two-step conversion budget through the backend and keep it independent from imported statement transactions and analytics.
- Persist the wealth portfolio through the backend and keep all wealth calculations out of Angular services/components.
- Keep only the `Presupuesto`, `Balance de Pago`, and `Importar` views mounted in the main shell, with chart/spending/transaction analysis components displayed inside `Importar`.
- Default to dark mode with the light/dark toggle hidden from the current UI.

## Open Items

- Confirm any additional bank/card statement formats beyond generic CSV, Banco Popular text, and CreditCardMovementsDetail CSV.
- Decide whether budget thresholds should remain monthly defaults or become period-aware signals.
- Add controls and endpoints to delete individual stored statements without clearing the entire backend data store.