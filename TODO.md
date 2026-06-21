# TODO

## 1. Project Setup

- [ ] Create Vite React TypeScript project files.
- [ ] Enable TypeScript strict mode.
- [ ] Add Tailwind CSS.
- [ ] Add shadcn/ui base setup.
- [ ] Add required dependencies:
  - [ ] `dexie`
  - [ ] `react-router-dom`
  - [ ] `vite-plugin-pwa`
  - [ ] `sonner`
  - [ ] shadcn/ui dependencies
- [ ] Add `.env.example` with `VITE_GOOGLE_CLIENT_ID`.

## 2. App Structure

- [ ] Create `src/app/App.tsx`.
- [ ] Create `src/app/router.tsx`.
- [ ] Create `src/types/index.ts`.
- [ ] Create `src/lib/utils.ts`.
- [ ] Create `src/lib/dates.ts`.
- [ ] Create `src/lib/validators.ts`.
- [ ] Create page folders and component folders.

## 3. Database Layer

- [ ] Create Dexie database in `src/db/db.ts`.
- [ ] Add `books`, `quotes`, and `meta` tables.
- [ ] Create repository functions in `src/db/repositories.ts`.
- [ ] Use `crypto.randomUUID()` for ids.
- [ ] Use ISO strings for dates.

## 4. Backup Data Layer

- [ ] Create `src/db/backup.ts`.
- [ ] Implement export object generation.
- [ ] Implement JSON download.
- [ ] Implement import validation.
- [ ] Implement local data replacement after confirmation.

## 5. Books Page

- [ ] Redirect `/` to `/books`.
- [ ] List books sorted by `updatedAt` descending.
- [ ] Search books and quotes.
- [ ] Show quote count per book.
- [ ] Create book.
- [ ] Edit book.
- [ ] Delete book with confirmation.
- [ ] Add empty state.
- [ ] Add loading state.

## 6. Book Detail Page

- [ ] Load selected book.
- [ ] List quotes sorted by `createdAt` descending.
- [ ] Create quote.
- [ ] Edit quote.
- [ ] Delete quote with confirmation.
- [ ] Support optional page.
- [ ] Support optional tags.
- [ ] Add back navigation to books.
- [ ] Add empty state.

## 7. Settings Page

- [ ] Show local storage status.
- [ ] Export JSON.
- [ ] Import JSON with confirmation.
- [ ] Show last backup date.
- [ ] Connect Google Drive.
- [ ] Backup now.
- [ ] Restore backup with confirmation.

## 8. Google Drive Service

- [ ] Create `src/services/googleDrive.ts`.
- [ ] Load Google Identity Services.
- [ ] Request OAuth token with only `drive.appdata` scope.
- [ ] Find existing `reading-notes-backup.json` in `appDataFolder`.
- [ ] Upload new backup if no file exists.
- [ ] Update existing backup if found.
- [ ] Download and parse backup for restore.
- [ ] Keep Drive code isolated from UI components.

## 9. PWA

- [ ] Configure `vite-plugin-pwa`.
- [ ] Add manifest:
  - [ ] name: `Reading Notes`
  - [ ] short name: `Notes`
  - [ ] display: `standalone`
  - [ ] theme color: neutral or muted indigo
- [ ] Cache app shell for offline usage.

## 10. UI Integration

- [ ] Wait for Google Stitch UI from user.
- [ ] Map Stitch layout to app routes.
- [ ] Apply warm neutral mobile-first visual direction.
- [ ] Use card-based vertical lists.
- [ ] Add bottom navigation on mobile.
- [ ] Add simple desktop navigation.
- [ ] Use shadcn/ui components for forms, dialogs, cards, badges, buttons, inputs, textarea, and toasts.
- [ ] Verify responsive behavior on mobile and desktop.

## 11. Documentation

- [ ] Complete README setup instructions.
- [ ] Document local dev.
- [ ] Document Google OAuth setup.
- [ ] Document Cloudflare Pages deployment.
- [ ] Document backup/restore behavior.
- [ ] Document known limitation: backup/restore only, no real-time multi-device sync.

## 12. Verification

- [ ] Run TypeScript check.
- [ ] Run production build.
- [ ] Verify offline behavior.
- [ ] Verify export/import flow.
- [ ] Verify Google Drive backup/restore flow when client id is available.
