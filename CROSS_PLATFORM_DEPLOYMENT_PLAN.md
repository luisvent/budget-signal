# Budget Signal Cross-Platform Deployment Plan

Last updated: May 23, 2026

## Goal

Build Budget Signal as one product that runs well on:

- Web browsers through an Angular SPA Docker service plus an independent Node API Docker service.
- iPhone as an installable app without publishing to the public App Store.

The architecture should keep the existing separation between frontend and backend:

- Angular owns UI, interaction, responsive layout, and local platform integration.
- Node owns persistence, statement parsing, financial summary engines, email delivery, and API contracts.
- Docker remains the simplest production path for deploying the web and API services together or separately.

## Current Project Shape

The project is already close to the right shape for cross-platform delivery.

- Angular 21 SPA lives under `apps/web/src/`.
- Node API lives under `apps/api/src/`.
- `apps/web/src/app/core/services/api-client.service.ts` is the frontend API boundary.
- Frontend services call backend endpoints through `/api/...` paths.
- Local development runs the API on `127.0.0.1:3000` and Angular on `localhost:4200` with `apps/web/proxy.conf.json` forwarding `/api`.
- Docker builds two deployment targets: Angular web served by Nginx on port `4210`, and the Node API on port `8734`.
- Production persistence is a JSON store mounted at `/data` through Docker volume `budget-signal-data`.
- Backend engines generate the important financial summaries, so iOS does not need a separate business-logic implementation.

This means the best mobile strategy is to reuse the Angular app and keep the Node API as the single source of truth.

## Recommended Delivery Strategy

Use two iOS-friendly delivery options, in this order:

1. Add PWA support for the fastest install path.
2. Add Capacitor for a native iOS shell that can be installed locally through Xcode.

The PWA gives the easiest local install experience: deploy the existing Docker web app, open it in Safari on iPhone, then use Add to Home Screen. This does not require App Store publishing, Apple Developer Program membership, Xcode signing, or TestFlight.

Capacitor gives a real iOS app bundle using the same Angular code. It can be installed on personal devices from Xcode without public App Store release. It does require a Mac, Xcode, an Apple ID, and iPhone Developer Mode.

## Target Architecture

```text
Web browser
  -> https://budget.example.com
  -> Docker web service on port 4210
  -> Nginx serves Angular static files and proxies /api to the API service
  -> JSON data persisted in /data

External API client
  -> https://api.budget.example.com or http://server:8734
  -> Docker API service on port 8734
  -> JSON data persisted in /data

iOS PWA
  -> Safari Add to Home Screen
  -> https://budget.example.com
  -> same web service and proxied /api

iOS Capacitor app
  -> Angular build bundled inside WKWebView
  -> calls https://api.budget.example.com/api or the deployed API origin
  -> same API service
```

The web app can continue using same-origin `/api` calls through the web service proxy. Native shells and other clients should call the API service through an absolute HTTPS API base URL because `/api` inside Capacitor points at the local app WebView origin, not the deployed server.

## Local iOS Install Options

### Option A: PWA Add To Home Screen

This is the simplest solution and should be implemented first.

How it works:

1. Deploy the web service to a reachable HTTPS URL and the API service behind the web proxy or its own HTTPS API URL.
2. Open the URL in Safari on iPhone.
3. Tap Share.
4. Tap Add to Home Screen.
5. Launch Budget Signal from the home screen icon.

Benefits:

- No App Store.
- No TestFlight.
- No Xcode.
- No provisioning profiles.
- Uses the existing Docker deployment services.
- Updates are instant after redeploying the web app.

Tradeoffs:

- It is still a web app, not a native IPA.
- Native APIs are limited compared with Capacitor.
- iOS PWA storage and background behavior are controlled by Safari.
- File import should work through normal browser file input, but the UX depends on iOS Safari's file picker.

This is the best fit if the main requirement is personal use with the least deployment friction.

### Option B: Capacitor Local Install Through Xcode

This is the recommended native-app path when an actual installed iOS app is needed.

How it works:

1. Build Angular for iOS.
2. Sync the web build into a Capacitor iOS project.
3. Open the generated iOS workspace in Xcode.
4. Connect the iPhone by USB or Wi-Fi.
5. Enable Developer Mode on the iPhone.
6. Select a signing team in Xcode.
7. Run the app directly on the device.

Benefits:

- No public App Store release.
- Same Angular UI and services.
- Can add native plugins later, such as secure storage, file access, biometrics, or share sheet support.
- Keeps the API and Docker backend unchanged.

Tradeoffs:

- Requires Xcode and iOS signing.
- A free Apple ID can install on personal devices, but the app may need to be re-signed frequently.
- A paid Apple Developer account gives a smoother signing experience for personal devices.
- Updates require rebuilding and reinstalling from Xcode unless TestFlight or another distribution path is added later.

### Option C: TestFlight Without Public App Store Release

TestFlight is useful later, but it is not the simplest local-install answer.

Benefits:

- No public App Store listing is required.
- Easier installs for multiple devices or testers.
- Better update flow than manual Xcode install.

Tradeoffs:

- Requires Apple Developer Program membership.
- Requires App Store Connect setup.
- Builds expire after the TestFlight period.
- More process than needed for a personal app.

Use TestFlight only if the app needs to be shared with other people or multiple devices without plugging into Xcode.

## Recommended Decision

Implement PWA support first, then Capacitor.

PWA is the fastest way to satisfy "use it on iPhone without App Store" while keeping deployment extremely simple. Capacitor should be added after the API base URL and mobile polish are ready, because it provides the native app path without forcing a rewrite.

Do not rewrite the app in Flutter, React Native, SwiftUI, or Ionic. The current Angular app is already mobile-friendly, backend-backed, and structured around services. A rewrite would increase deployment complexity without improving the core architecture.

## Implementation Plan

### Phase 1: Stabilize Independent Web Plus API Deployment

- Keep `docker-compose.yml` with separate `web` and `api` services.
- Serve Angular through the `web` service on port `4210`.
- Serve the Node API through the `api` service on port `8734`.
- Keep the `budget-signal-data` volume mounted only on the API service.
- Keep the web service proxying `/api` to the API service so the Angular app can use same-origin requests.
- Put the app behind HTTPS before using it from iPhone outside local development.
- Use a reverse proxy such as Caddy, Traefik, Nginx Proxy Manager, Cloudflare Tunnel, or Portainer-managed stack routing.
- Set `CORS_ORIGIN` to the production web URL instead of `*` once authentication is added.
- Keep `/api/health` public for health checks.

Expected production shape:

```text
https://budget.example.com
  -> reverse proxy with TLS
  -> Docker web service:4210
  -> Angular static files and /api proxy

https://api.budget.example.com or trusted clients
  -> reverse proxy with TLS or server port 8734
  -> Docker API service:8734
  -> /data Docker volume
```

### Phase 2: Add Platform-Aware API Base URL

Update the frontend API client so every request uses one centralized base URL resolver.

Current behavior:

```text
fetch('/api/state')
```

Target behavior:

```text
web production: fetch('/api/state')
iOS Capacitor: fetch('https://api.budget.example.com/api/state')
```

Recommended implementation:

- Add Angular environment files for web and iOS.
- Add an `apiBaseUrl` value.
- Keep web `apiBaseUrl` empty.
- Set iOS `apiBaseUrl` to the deployed HTTPS origin.
- Update `ApiClientService` to combine `apiBaseUrl` and path.

Example configuration shape:

```ts
export const environment = {
  production: true,
  apiBaseUrl: ''
};
```

```ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://budget.example.com'
};
```

The iOS URL should not include `/api`; callers already pass `/api/...`.

Current implementation:

- Web environment files live under `apps/web/src/environments/`.
- Web builds keep `apiBaseUrl` empty for same-origin `/api` requests.
- The `ios` Angular build configuration replaces the normal environment with `environment.ios.ts`.
- `environment.ios.ts` contains a placeholder API origin that must be changed to the deployed HTTPS API domain before a Capacitor build.
- `ApiClientService` centralizes URL resolution for all API calls.

### Phase 3: Add PWA Support

Add Angular PWA support and a minimal manifest.

Suggested command:

```bash
ng add @angular/pwa
```

Then verify:

- App has a valid web manifest.
- Icons exist for iOS home screen and browser installs.
- The app has a clear name and theme color.
- The service worker does not cache API responses in a way that makes financial data stale.
- Navigating to the deployed HTTPS URL works from iPhone Safari.
- Add to Home Screen launches in standalone mode.

Current implementation:

- `apps/web/public/manifest.webmanifest` defines the installable web app metadata.
- `apps/web/ngsw-config.json` caches static app assets and intentionally leaves API responses uncached.
- `apps/web/src/app/app.config.ts` registers Angular's service worker only for production builds.
- `apps/web/src/index.html` includes manifest, theme color, and iOS standalone metadata.

Recommended PWA stance:

- Cache static app assets.
- Do not aggressively cache `/api` responses.
- Let backend data remain source-of-truth.
- Keep offline support minimal at first: show an API unavailable state rather than pretending edits are saved.

### Phase 4: Add Basic Mobile Polish

Before treating the iPhone install as production-ready:

- Add safe-area padding for iPhone bottom navigation and top edges.
- Confirm no button text overflows on small iPhone widths.
- Confirm statement upload works from Files on iOS Safari.
- Confirm the dashboard, Presupuesto, Balance, Patrimonio, and Importar views fit without horizontal scrolling.
- Add clearer sync/error states when the API is unreachable.
- Debounce automatic saves from Angular signal effects so remote API writes are not too chatty.

The current services save state after signal changes. That is convenient, but mobile remote API calls should be batched or debounced.

### Phase 5: Add Capacitor Native iOS Shell

Install Capacitor packages:

```bash
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/ios
```

Initialize Capacitor:

```bash
npx cap init "Budget Signal" "com.yourdomain.budgetsignal" --web-dir dist/apps/web/browser
npx cap add ios
```

Add package scripts:

```json
{
  "build:ios": "ng build --configuration ios",
  "cap:sync:ios": "npm run build:ios && npx cap sync ios",
  "cap:open:ios": "npx cap open ios"
}
```

Add an Angular `ios` build configuration that replaces the normal environment with the iOS environment containing the deployed API origin.

Expected Capacitor config:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourdomain.budgetsignal',
  appName: 'Budget Signal',
  webDir: 'dist/apps/web/browser',
  server: {
    cleartext: false
  }
};

export default config;
```

Do not point Capacitor at the Angular dev server for normal personal use. Bundle the built Angular app and let it call the deployed HTTPS API.

### Phase 6: Install iOS App Locally

Local install steps:

1. Install Xcode from the Mac App Store.
2. Open Xcode once and accept required components.
3. Connect the iPhone to the Mac.
4. Enable Developer Mode on the iPhone if prompted.
5. Run:

```bash
npm run cap:sync:ios
npm run cap:open:ios
```

6. In Xcode, select the physical iPhone as the run target.
7. Set Signing & Capabilities to a personal Apple ID team or paid developer team.
8. Press Run.
9. If iOS asks to trust the developer certificate, approve it in Settings.

This installs the app locally without App Store publication.

Recommended signing choice:

- For one personal device and occasional use, a free Apple ID can work.
- For less friction and longer-lived installs, use a paid Apple Developer account.
- For multiple testers, use TestFlight later.

### Phase 7: Secure The API For Real Use

Before exposing the API publicly, add authentication.

Minimum acceptable personal-app approach:

- Add a backend login endpoint.
- Store a hashed password or use an environment-provided password hash.
- Return a signed session token.
- Require the token for every endpoint except `/api/health` and static assets.
- Store the token in browser storage for web at first.
- Store the token in iOS secure storage when Capacitor is added.

Better later approach:

- Use OAuth/OIDC, passkeys, or a small identity provider if this becomes multi-user.

Do not put a permanent API secret inside the Angular or Capacitor bundle. Anything bundled into the frontend can be extracted.

### Phase 8: Optional Native Enhancements

Only add native plugins after the basic Capacitor app works.

Useful later additions:

- Secure storage for auth tokens.
- Share sheet export for reports.
- Filesystem integration for imports or exports.
- Face ID / Touch ID gate before opening the app.
- Native splash screen and icon set.

Avoid adding native plugins until there is a clear user-facing need.

## Deployment Commands

### Web/API Docker

```bash
source "$HOME/.nvm/nvm.sh"
nvm use 22
npm ci
npm run build
docker compose up --build -d
curl https://budget.example.com/api/health
```

### PWA iPhone Install

```text
Open https://budget.example.com in Safari
Share -> Add to Home Screen
Launch Budget Signal from the icon
```

### Capacitor iOS Local Install

```bash
source "$HOME/.nvm/nvm.sh"
nvm use 22
npm ci
npm run cap:sync:ios
npm run cap:open:ios
```

Then build and run from Xcode onto the connected iPhone.

## Risks And Decisions

### Keep JSON Store Unless Multi-User Is Required

The JSON store is appropriate for a personal budgeting app and keeps deployment simple. If the app becomes multi-user, move to SQLite or Postgres with per-user data ownership.

### Keep Backend Logic In Node

Do not duplicate summary engines in the iOS app. The backend should remain the owner of financial logic, defaults, parsing, summaries, email, and persistence.

### Prefer HTTPS Everywhere For iOS

iOS is strict about network security. Use HTTPS for the deployed API. Avoid cleartext HTTP except in short-lived local development.

### PWA First, Capacitor Second

The PWA install path gives the fastest working iPhone experience with almost no deployment burden. Capacitor gives the native wrapper after the API URL and security posture are ready.

## Definition Of Done

- Web/API still deploy as independent Docker services.
- `/api/health` works through the deployed HTTPS domain.
- The web app still uses same-origin `/api` paths.
- iPhone can install the app as a PWA from Safari.
- The PWA loads the dashboard and can read/write budget data.
- Capacitor iOS build can be synced and opened in Xcode.
- The iOS app calls the deployed HTTPS API using the configured API base URL.
- The iOS app can be installed locally on a physical device without App Store publication.
- API is protected before being exposed beyond a trusted network.