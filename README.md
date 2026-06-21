# Reading Notes PWA

Production-ready MVP for a local-first personal reading notes PWA.

The app lets you create books and save quotes, notes, pages and tags under each book. It works without login and stores data locally in IndexedDB. Google Drive is optional and only used for manual backup and restore.

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- Dexie.js / IndexedDB
- React Router
- vite-plugin-pwa
- Google Identity Services + Google Drive API `appDataFolder`

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open on desktop:

```text
http://localhost:5173/
```

## Open On Mobile

Keep the dev server running. Vite prints a network URL like:

```text
http://192.168.1.6:5173/
```

On your phone:

1. Connect to the same Wi-Fi as this computer.
2. Open the printed `http://192.168.x.x:5173/` address in the mobile browser.
3. For install-like PWA behavior, use the browser menu and choose Add to Home Screen.

If the phone cannot open it, check Windows Firewall and allow Node.js/Vite on private networks.

## Build

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Google OAuth Setup

Create a Google OAuth Web client and set:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Use `.env.local` for local development. Do not commit real secrets.

Authorized JavaScript origins should include:

```text
http://localhost:5173
```

For production, also add your Cloudflare Pages domain.

The app requests only this scope:

```text
https://www.googleapis.com/auth/drive.appdata
```

## Backup And Restore

Local data is stored in IndexedDB and works offline after the app shell is cached.

Export downloads JSON in this format:

```json
{
  "version": 1,
  "exportedAt": "ISO_DATE",
  "books": [],
  "quotes": [],
  "meta": {}
}
```

Google Drive backup writes one file to the app data folder:

```text
reading-notes-backup.json
```

Restore replaces local IndexedDB data after confirmation.

Known limitation: this is backup/restore only. There is no real-time multi-device sync or conflict resolution engine.

## Cloudflare Pages Deploy

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Set the production environment variable in Cloudflare Pages:

```text
VITE_GOOGLE_CLIENT_ID
```

Also add the Cloudflare Pages URL to the Google OAuth client's authorized JavaScript origins.
