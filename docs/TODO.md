# TODO

## Done

- [x] Build React/Vite/TypeScript app.
- [x] Add Tailwind CSS and local shadcn/ui-style components.
- [x] Implement Dexie IndexedDB schema for books, quotes and metadata.
- [x] Implement book CRUD.
- [x] Implement quote CRUD with note, page and tags.
- [x] Implement search across books and quotes.
- [x] Implement JSON export/import with confirmation.
- [x] Implement optional Google Drive backup/restore service.
- [x] Configure PWA manifest and service worker generation.
- [x] Integrate Stitch-inspired UI.
- [x] Change primary theme from blue to calm green.
- [x] Deploy to Netlify.
- [x] Shorten Netlify URL to `https://kitapnot.netlify.app`.
- [x] Configure `VITE_GOOGLE_CLIENT_ID` locally and in Netlify.
- [x] Commit docs under `docs/`.

## Next

- [ ] Test Google Drive connect/backup/restore on the live site with the configured OAuth client.
- [ ] If Google Cloud OAuth consent screen is still in Testing mode, add intended users as test users or publish the app.
- [ ] Consider linking Netlify continuous deployment to GitHub so future pushes auto-deploy.
- [ ] Add a small automated smoke test later if the app keeps evolving.

## Useful Commands

```bash
npm run build
netlify deploy --prod --dir dist
git status --short --branch
```
