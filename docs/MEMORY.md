# Project Memory

## Current Status

- Project: local-first personal reading notes PWA.
- GitHub private repo: `zkoymen/kitap-alinti`
- Production URL: `https://kitapnot.netlify.app`
- Netlify site name: `kitapnot`
- Netlify site id: `b93fb640-751c-494b-bad3-1263737a796e`
- Main branch: `main`
- App is already deployed and live.

## Product

The app lets users create books and save quotes, reflections, page numbers and tags under each book. Normal use does not require login.

Data is local-first:

- Books/quotes/meta are stored in browser IndexedDB.
- Google Drive is optional and only used for manual backup/restore.
- There is no backend database.
- There is no real-time multi-device sync.

Backup model:

- Export/import JSON works locally.
- Google Drive backup uses `appDataFolder`.
- Backup file name: `reading-notes-backup.json`
- Restore replaces local IndexedDB data after confirmation.

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- Dexie.js for IndexedDB
- React Router
- vite-plugin-pwa
- Google Identity Services OAuth
- Google Drive API
- Netlify static hosting

## Important Files

- `src/db/db.ts`: Dexie database schema.
- `src/db/repositories.ts`: CRUD and metadata repository functions.
- `src/db/backup.ts`: JSON export/import and local replacement.
- `src/services/googleDrive.ts`: isolated Google OAuth and Drive API integration.
- `src/pages/BooksPage.tsx`: book list/search/create/edit/delete.
- `src/pages/BookDetailPage.tsx`: quote list/create/edit/delete.
- `src/pages/SettingsPage.tsx`: storage, import/export, Drive backup/restore.
- `netlify.toml`: Netlify build and SPA redirect config.
- `.env.example`: public template for required env var.
- `.env.local`: local-only ignored file; do not commit it.

## Environment Variables

Required for Google Drive backup/restore:

```text
VITE_GOOGLE_CLIENT_ID
```

This value is configured in:

- local `.env.local`
- Netlify environment variables

Do not commit `.env.local`.

Google Cloud OAuth setup:

- Application type: Web application
- Authorized JavaScript origins:
  - `https://kitapnot.netlify.app`
  - optional local dev: `http://localhost:5173`
- Authorized redirect URIs: leave empty.
- Enable `Google Drive API` in the same Google Cloud project as the OAuth client.

Reason: the app uses browser-based Google Identity Services token flow, not a server redirect flow.

## Commands

Local dev:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Manual Netlify production deploy:

```bash
netlify deploy --prod --dir dist
```

Set Netlify env var:

```bash
netlify env:set VITE_GOOGLE_CLIENT_ID <client-id>
```

## Design Notes

Original Stitch UI direction was adapted into a minimal mobile-first notebook/library UI.

Current brand color is green:

- primary/theme color: `#2f6f4e`
- earlier blue/indigo theme was intentionally removed.

Keep the UI calm, reading-focused and card/list based. Avoid dashboards, social features and AI features.

## Deployment Notes

The app is static and hosted on Netlify. Users should open:

```text
https://kitapnot.netlify.app
```

They do not need local servers, VS Code or environment variables.

Only the project owner/developer needs env vars and deploy commands.

## Known Limitations

- Google Drive flow should be tested end-to-end after OAuth consent screen is configured/published.
- Google OAuth may only work for test users while Google Cloud consent screen is in Testing mode.
- No conflict resolution or automatic sync between devices.
- Data can be lost if a browser profile is cleared and no JSON/Drive backup exists.

## Planned OCR Capture Feature

Goal: make quote capture faster on mobile by letting the user add quote text from a camera/photo instead of copying text through another app.

Preferred implementation direction:

- Keep the app local-first and avoid paid OCR APIs by default.
- Use browser-based OCR with Tesseract.js/WebAssembly, so images are processed on-device.
- Keep Google Cloud Vision / Gemini-style OCR out of the MVP because it introduces billing, API keys, backend/security work and privacy concerns.
- Add a secondary action next to `Add entry`, such as `Add from photo`.
- Support image selection/camera capture first with `<input type="file" accept="image/*" capture="environment">`.
- Add a crop/selection step before OCR so the user can choose only the quote area.
- Insert extracted text into the existing quote form for review/edit before saving.
- Request camera/photo access only when the user explicitly starts photo capture; no notification permission is needed for this feature.
- Default OCR language is Turkish (`tur`) because most photographed book excerpts are expected to be Turkish.
- OCR images are preprocessed locally before recognition: upscale, grayscale, contrast boost, adaptive threshold and sharpening.
- The Tesseract worker is cached for the browser session so repeated captures in the same reading session avoid reinitializing OCR.
- First OCR use may download OCR worker/core/language assets, then browser caching should make repeat use faster.

Important constraints:

- OCR accuracy depends heavily on lighting, focus, page angle, font and crop quality.
- Mobile performance may be slower with on-device OCR; show progress and allow cancel.
- The extracted text must never auto-save without user review.
- Existing manual quote entry must remain unchanged as the reliable fallback.
- If local OCR quality remains poor after preprocessing, reassess before adding any cloud OCR because cloud OCR changes cost, privacy and backend/security requirements.

## Important Process Notes

- Do not delete `docs/MEMORY.md`.
- Keep docs under `docs/` committed to GitHub.
- Do not commit `.env.local`, `dist/`, `node_modules/` or `.netlify/`.
- After feature work, run a security sanity check before deployment: dependency audit, no committed secrets, least-permission browser/API scopes, and no unnecessary cloud/billing services.
