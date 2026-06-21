# TODO

## Done

- [x] Create Vite React TypeScript project files.
- [x] Enable TypeScript strict mode.
- [x] Add Tailwind CSS.
- [x] Add shadcn/ui-style local components.
- [x] Add Dexie database with `books`, `quotes`, and `meta` tables.
- [x] Add repository functions for books, quotes, metadata and local stats.
- [x] Implement JSON export/import with validation and replacement confirmation.
- [x] Implement `/` redirect to `/books`.
- [x] Implement `/books` list, search, create, edit and delete.
- [x] Show quote count per book and sort by `updatedAt` descending.
- [x] Implement `/books/:bookId` detail with quote create, edit and delete.
- [x] Support optional page and tags for quotes.
- [x] Sort quotes by `createdAt` descending.
- [x] Implement `/settings` local storage status, export/import and backup controls.
- [x] Add Google Drive OAuth service using `drive.appdata` scope only.
- [x] Upload or update `reading-notes-backup.json` in `appDataFolder`.
- [x] Restore Google Drive backup after confirmation.
- [x] Configure vite-plugin-pwa manifest and app shell precache.
- [x] Add `.env.example` with `VITE_GOOGLE_CLIENT_ID`.
- [x] Integrate Google Stitch design direction into the app UI.
- [x] Add README setup, mobile access, OAuth and Cloudflare Pages notes.
- [x] Run production build.

## Later

- [ ] Test Google Drive backup/restore with a real OAuth client id.
- [ ] Add automated browser tests after the first production deployment.
