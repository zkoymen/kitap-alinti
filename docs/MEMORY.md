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

## Important Process Notes

- Do not delete `docs/MEMORY.md`.
- Keep docs under `docs/` committed to GitHub.
- Do not commit `.env.local`, `dist/`, `node_modules/` or `.netlify/`.
