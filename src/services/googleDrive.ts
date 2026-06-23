import type { BackupExport } from "@/types";
import { createId } from "@/lib/id";

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

interface GoogleApiError {
  code?: number;
  message?: string;
  status?: string;
  errors?: Array<{
    message?: string;
    domain?: string;
    reason?: string;
  }>;
  details?: Array<{
    reason?: string;
    metadata?: {
      activationUrl?: string;
      consumer?: string;
      containerInfo?: string;
      service?: string;
      serviceTitle?: string;
    };
  }>;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function getGoogleApiError(value: unknown): GoogleApiError | null {
  if (!isRecord(value) || !isRecord(value.error)) return null;
  return value.error as GoogleApiError;
}

function getProjectId(error: GoogleApiError) {
  const details = error.details ?? [];
  const metadata = details.map((detail) => detail.metadata).find(Boolean);
  const consumer = metadata?.consumer?.replace(/^projects\//, "");
  if (consumer) return consumer;

  const containerInfo = metadata?.containerInfo;
  if (containerInfo) return containerInfo;

  const projectMatch = error.message?.match(/project\s+(\d+)/i);
  return projectMatch?.[1];
}

function formatGoogleDriveError(status: number, bodyText: string, fallback: string) {
  const apiError = getGoogleApiError(parseJson(bodyText));
  if (!apiError) {
    return bodyText || fallback;
  }

  const reasons = [
    apiError.status,
    ...(apiError.errors?.map((error) => error.reason) ?? []),
    ...(apiError.details?.map((detail) => detail.reason) ?? [])
  ].filter(Boolean);
  const disabled =
    status === 403 &&
    (reasons.includes("SERVICE_DISABLED") ||
      reasons.includes("accessNotConfigured") ||
      apiError.message?.includes("has not been used") ||
      apiError.message?.includes("is disabled"));

  if (disabled) {
    const projectId = getProjectId(apiError);
    return [
      `Google Drive API is disabled${projectId ? ` for Google Cloud project ${projectId}` : ""}.`,
      "Enable Google Drive API in Google Cloud Console, wait a few minutes, then try again."
    ].join(" ");
  }

  if (status === 401) {
    return "Google Drive authorization expired. Disconnect, connect again, then retry.";
  }

  const message = apiError.message || fallback;
  return `Google Drive API ${apiError.code ?? status}: ${message}`;
}

async function throwGoogleDriveError(response: Response, fallback: string): Promise<never> {
  const bodyText = await response.text();
  throw new Error(formatGoogleDriveError(response.status, bodyText, fallback));
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
    await throwGoogleDriveError(response, `Google Drive request failed with ${response.status}.`);
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
  const boundary = `reading-notes-${createId()}`;
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
    await throwGoogleDriveError(response, "Could not download the Google Drive backup.");
  }

  return response.json() as Promise<BackupExport>;
}
