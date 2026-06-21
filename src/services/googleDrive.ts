import type { BackupExport } from "@/types";

const GIS_SRC = "https://accounts.google.com/gsi/client";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const BACKUP_FILE_NAME = "reading-notes-backup.json";

interface TokenResponse {
  access_token: string;
  expires_in?: number;
  error?: string;
}

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
          }) => TokenClient;
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
  }
}

let accessToken: string | null = null;
let tokenClient: TokenClient | null = null;

function getClientId() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) {
    throw new Error("VITE_GOOGLE_CLIENT_ID is not configured.");
  }

  return clientId;
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (window.google?.accounts?.oauth2) resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Identity Services failed to load.")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Identity Services failed to load."));
    document.head.append(script);
  });
}

async function ensureTokenClient() {
  await loadScript(GIS_SRC);

  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google Identity Services is unavailable.");
  }

  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: getClientId(),
      scope: DRIVE_SCOPE,
      callback: () => undefined
    });
  }

  return tokenClient;
}

export async function connectGoogleDrive() {
  const client = await ensureTokenClient();

  return new Promise<void>((resolve, reject) => {
    tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: getClientId(),
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        accessToken = response.access_token;
        resolve();
      }
    });

    tokenClient.requestAccessToken({ prompt: accessToken ? "" : "consent" });

    void client;
  });
}

export function isGoogleDriveConnected() {
  return Boolean(accessToken);
}

export async function disconnectGoogleDrive() {
  if (!accessToken || !window.google?.accounts?.oauth2) {
    accessToken = null;
    return;
  }

  await new Promise<void>((resolve) => {
    window.google!.accounts.oauth2.revoke(accessToken!, () => resolve());
  });
  accessToken = null;
}

async function ensureAccessToken() {
  if (!accessToken) {
    await connectGoogleDrive();
  }

  if (!accessToken) {
    throw new Error("Google Drive is not connected.");
  }

  return accessToken;
}

async function driveFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await ensureAccessToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Google Drive request failed with ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

async function findBackupFile(): Promise<DriveFile | null> {
  const query = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and trashed=false`);
  const response = await driveFetch<{ files: DriveFile[] }>(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${query}&fields=files(id,name,modifiedTime)`
  );

  return response.files[0] ?? null;
}

function createMultipartBody(metadata: Record<string, unknown>, data: BackupExport) {
  const boundary = `reading-notes-${crypto.randomUUID()}`;
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(data, null, 2),
    `--${boundary}--`
  ].join("\r\n");

  return { boundary, body };
}

export async function uploadBackupToDrive(data: BackupExport) {
  const existing = await findBackupFile();
  const metadata = existing
    ? { name: BACKUP_FILE_NAME, mimeType: "application/json" }
    : { name: BACKUP_FILE_NAME, mimeType: "application/json", parents: ["appDataFolder"] };
  const { boundary, body } = createMultipartBody(metadata, data);
  const method = existing ? "PATCH" : "POST";
  const url = existing
    ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart&fields=id,name,modifiedTime`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime";

  return driveFetch<DriveFile>(url, {
    method,
    headers: {
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body
  });
}

export async function downloadBackupFromDrive() {
  const file = await findBackupFile();
  if (!file) {
    throw new Error("No backup file was found in Google Drive appDataFolder.");
  }

  const token = await ensureAccessToken();
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not download the Google Drive backup.");
  }

  return response.json() as Promise<BackupExport>;
}
