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
- [ ] Confirm Google Drive API is enabled in Google Cloud project `315391209834`.
- [ ] If Google Cloud OAuth consent screen is still in Testing mode, add intended users as test users or publish the app.
- [ ] Test OCR capture on mobile browser/PWA and confirm camera permission behavior.
- [ ] Consider linking Netlify continuous deployment to GitHub so future pushes auto-deploy.
- [ ] Add a small automated smoke test later if the app keeps evolving.

## OCR Capture Implemented

- [x] Design mobile quote capture from photo/camera.
- [x] Add an `Add from photo` entry point on the book detail page.
- [x] Add image input/camera capture using `accept="image/*"` and `capture="environment"`.
- [x] Add a crop/selection UI so OCR runs only on the selected quote area.
- [x] Add local OCR processing with Tesseract.js/WebAssembly, without sending images to a paid cloud API.
- [x] Set default OCR language to Turkish for photographed book excerpts.
- [x] Add local preprocessing before OCR: upscale, grayscale, contrast boost, adaptive threshold and sharpening.
- [x] Cache the Tesseract worker during the browser session for faster repeated captures.
- [x] Show OCR progress, cancel/error states and mobile-friendly loading feedback.
- [x] Put OCR result into the existing quote form for manual correction before save.

## Useful Commands

```bash
npm run build
netlify deploy --prod --dir dist
git status --short --branch
```
