# Budget Signal — 10 Mobile-First Native-iOS Redesigns

Each concept lives on its own branch (`ui/redesign-<name>`) branched from `main`. Every concept rewrites only three files so the TypeScript / data layer stays valid:

- `apps/web/src/app/app.component.html` — shell template (header, home, tab bar, lock, settings sheet)
- `apps/web/src/app/app.component.scss` — shell + feature-component reskinning (via `.theme-X` descendant selectors)
- `apps/web/src/styles.scss` — global design tokens (`--black`, `--surface`, `--accent`, `--text-*`, etc.) re-bound to the concept palette, plus the base font family and body background. Because every feature component consumes these tokens, the redesign reaches the inner views (Presupuesto, Balance, Patrimonio, Importar) automatically.

## Cross-cutting mandates

- **Mobile-first.** Max-width ~520px shell, safe-area paddings (`env(safe-area-inset-top/bottom)`), fixed bottom tab bar.
- **Native-iPhone look & feel.** SF-style typography, large rounded corners (16–28px), spring-eased transitions, frosted/blurred bars, sheet modals with drag handles, pill segmented controls.
- **Required selectors preserved everywhere:** `.access-lock-panel`, `.access-code-input`, `.access-lock-status`, `.signal-dot[data-level]`, `.mobile-nav` (4 tabs), `.desktop-nav` (hidden), and the four view bindings `'budget' | 'payment' | 'wealth' | 'import'`.
- **TS surface untouched.** All signals/methods (`activeView`, `showView`, `openSettings`, `closeSettings`, `toggleTheme`, `saveSettings`, `submitAccessCode`, `updateAccessCode`, `updateDraftExchangeRate`, `store.*`, `personalBudget.*`, `paymentBalance.*`, `wealth.*`) remain valid.

## The 10 concepts

### 1. `ui/redesign-monarch` — Monarch Money editorial
- **Palette:** cream `#F5F0E6` / forest `#2E5D3A` / olive `#6B8E47` / muted gold `#B8860B`.
- **Typography:** Playfair Display headlines, system sans body.
- **UX:** large editorial titles, generous whitespace, grouped iOS-style inset list rows, small contextual accent dots, no chrome on backgrounds.
- **Native cue:** iOS "Large Title" header that collapses on scroll; subtle paper-like background.

### 2. `ui/redesign-copilot-ios` — Copilot Money / iOS frosted glass
- **Palette:** iOS system white `#F2F2F7` + system blue `#007AFF` + system red `#FF3B30` + system green `#34C759`.
- **Typography:** -apple-system / SF Pro stack.
- **UX:** frosted `backdrop-filter` bars, segmented control for view switching, grouped lists, large numerals, SF Symbol-like glyphs.
- **Native cue:** translucent navigation bar + tab bar with blur+saturate filters; pull-style sheet for settings.

### 3. `ui/redesign-revolut` — Revolut neon glass
- **Palette:** deep navy `#0A0E27` + electric purple `#BD00FF` + cyan `#00D2FF` + mint `#00D2A8`.
- **Typography:** Inter / Söhne-like sans, very tight tracking.
- **UX:** glassmorphic cards, quick-action 4-up icon grid on home, glowing accents on active states.
- **Native cue:** floating tab bar with pill highlight, haptic-style scale-down on press.

### 4. `ui/redesign-cash-app` — Cash App minimalism
- **Palette:** pure black `#000` + Cash green `#00D632` + white.
- **Typography:** custom Cash Sans / Inter, very large weights.
- **UX:** giant single-numeral hero, "no chrome" cards, ultra-flat buttons, monospace amounts.
- **Native cue:** edge-to-edge content, no borders, single bold action per screen.

### 5. `ui/redesign-mint-classic` — Mint / Intuit clarity
- **Palette:** white `#FFFFFF` + mint `#00B388` + soft teal + warm gold for warnings.
- **Typography:** Inter / Open Sans.
- **UX:** SVG progress ring on home, grouped iOS list rows for accounts/categories, friendly micro-copy.
- **Native cue:** iOS rounded inset lists, soft drop-shadows under cards, gentle spring on tab switch.

### 6. `ui/redesign-ynab-envelope` — YNAB envelope budgeting
- **Palette:** off-white `#FAFCFC` + deep teal `#00857C` + olive `#5BA055` + amber `#DB8E23`.
- **Typography:** Source Sans 3 / Inter, with slab accents on numbers.
- **UX:** every category rendered as an "envelope" card with an Available pill, swipe affordance hint, allocation chips.
- **Native cue:** iOS-style segmented control for cycles, sheet modal for assigning funds.

### 7. `ui/redesign-wealthfront` — Wealthfront editorial
- **Palette:** dark navy `#0E1B2C` + champagne gold `#D4A437` + warm ivory text `#F4EBD0`.
- **Typography:** Playfair Display / Georgia headlines, IBM Plex Mono ticker for KPIs.
- **UX:** masthead "ticker" of key numbers at top, editorial section dividers, restrained palette.
- **Native cue:** sticky frosted ticker bar, monospace digits feel "financial-grade".

### 8. `ui/redesign-rocket-money` — Rocket Money playful
- **Palette:** deep purple `#1A0B3D` → `#2A1655` gradient + hot pink `#FF4FBF` + lavender `#9D6BFF`.
- **Typography:** Inter / Söhne with rounded corners.
- **UX:** big purple gradient hero with "mission" cards, rocket/launch motif on CTAs, animated counters.
- **Native cue:** sheet-style settings, large fingertip-friendly buttons, bottom-sheet upsell aesthetic.

### 9. `ui/redesign-n26-minimal` — N26 strict editorial grid
- **Palette:** white `#FFFFFF` + ink `#0A0A0A` + cobalt `#0049D9`.
- **Typography:** IBM Plex Sans / Mono for section labels.
- **UX:** numbered sections (01, 02, 03, 04), strict 1px hairline rules, no rounded cards on home, monospace labels.
- **Native cue:** iOS large title + subtle haptic underline animation on tab change.

### 10. `ui/redesign-apple-wallet` — Apple Wallet pass stack
- **Palette:** charcoal `#1C1C1E` background, per-surface card colors — Presupuesto red `#B72C28`, Balance blue `#0A84FF`, Patrimonio gold `#C29A3C`, Importar graphite.
- **Typography:** -apple-system / SF Pro Display.
- **UX:** vertically stacked Wallet-pass cards on home, tap-to-expand to the matching feature view, chip + "card tag" header per pass.
- **Native cue:** Wallet-style 22px corner radius, soft inner glow, fixed translucent iOS tab bar, sheet modal for settings.

## Branch layout

```
main
├── ui/redesign-monarch
├── ui/redesign-copilot-ios
├── ui/redesign-revolut
├── ui/redesign-cash-app
├── ui/redesign-mint-classic
├── ui/redesign-ynab-envelope
├── ui/redesign-wealthfront
├── ui/redesign-rocket-money
├── ui/redesign-n26-minimal
└── ui/redesign-apple-wallet
```

## Local preview

```bash
git checkout ui/redesign-<concept>
npm start            # ng serve
# open http://localhost:4200 in iPhone-sized viewport / device toolbar
```
