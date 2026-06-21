# Reading Notes PWA

Local-first personal reading notes PWA.

This project will be built as a production-ready MVP with:

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Dexie.js / IndexedDB
- React Router
- vite-plugin-pwa
- Optional Google Drive backup through `appDataFolder`
- Static deployment support for Cloudflare Pages

## Product Scope

The app lets a user create books and save quotes or notes under each book. It must work offline after the first load and must not require login for normal usage.

Google login is only used for optional backup and restore.

## Planned Routes

- `/books` - book list, search, create/edit/delete books
- `/books/:bookId` - quote list for one book, create/edit/delete quotes
- `/settings` - export/import JSON, Google Drive backup/restore, local storage status

## Data Model

### Book

- `id: string`
- `title: string`
- `author?: string`
- `createdAt: string`
- `updatedAt: string`

### Quote

- `id: string`
- `bookId: string`
- `text: string`
- `note?: string`
- `page?: string`
- `tags?: string[]`
- `createdAt: string`
- `updatedAt: string`

### AppMeta

- `key: string`
- `value: unknown`

## Export Format

```json
{
  "version": 1,
  "exportedAt": "ISO_DATE",
  "books": [],
  "quotes": [],
  "meta": {}
}
```

## Google Drive Backup

The Drive integration will use:

- Google Identity Services
- Scope: `https://www.googleapis.com/auth/drive.appdata`
- Environment variable: `VITE_GOOGLE_CLIENT_ID`
- File name in appDataFolder: `reading-notes-backup.json`

Access tokens should stay in memory where possible.

## Status

Project scaffolding has not started yet. The next implementation step is to add the app codebase and then integrate the Google Stitch UI when provided.
