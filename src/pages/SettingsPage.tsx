import {
  Cloud,
  Database,
  Download,
  HardDrive,
  RotateCcw,
  Upload,
  UploadCloud
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  createBackupExport,
  downloadBackupJson,
  parseBackupFile,
  replaceLocalData
} from "@/db/backup";
import { getLocalStats, getMeta, setMeta } from "@/db/repositories";
import { formatDateTime } from "@/lib/dates";
import { validateBackupExport } from "@/lib/validators";
import {
  connectGoogleDrive,
  disconnectGoogleDrive,
  downloadBackupFromDrive,
  isGoogleDriveConnected,
  uploadBackupToDrive
} from "@/services/googleDrive";
import type { BackupExport } from "@/types";

interface LocalStats {
  bookCount: number;
  quoteCount: number;
  usage: number;
  quota: number;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<LocalStats | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | undefined>();
  const [connected, setConnected] = useState(isGoogleDriveConnected());
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<BackupExport | null>(null);
  const [pendingRestore, setPendingRestore] = useState<BackupExport | null>(null);

  async function loadSettings() {
    const [localStats, backupAt] = await Promise.all([
      getLocalStats(),
      getMeta<string>("lastBackupAt")
    ]);
    setStats(localStats);
    setLastBackupAt(backupAt);
    setConnected(isGoogleDriveConnected());
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function handleExport() {
    setBusyAction("export");
    try {
      downloadBackupJson(await createBackupExport());
      toast.success("JSON export downloaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setPendingImport(await parseBackupFile(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import file could not be read.");
    }
  }

  async function replaceWithBackup(data: BackupExport, successMessage: string) {
    setBusyAction("replace");
    try {
      await replaceLocalData(data);
      toast.success(successMessage);
      setPendingImport(null);
      setPendingRestore(null);
      await loadSettings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Local data could not be replaced.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleConnectDrive() {
    setBusyAction("connect");
    try {
      await connectGoogleDrive();
      setConnected(true);
      toast.success("Google Drive connected for this session.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google Drive connection failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDisconnectDrive() {
    setBusyAction("disconnect");
    try {
      await disconnectGoogleDrive();
      setConnected(false);
      toast.success("Google Drive disconnected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google Drive could not be disconnected.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleBackupNow() {
    setBusyAction("backup");
    try {
      const backup = await createBackupExport();
      await uploadBackupToDrive(backup);
      const timestamp = new Date().toISOString();
      await setMeta("lastBackupAt", timestamp);
      setLastBackupAt(timestamp);
      setConnected(true);
      toast.success("Backup uploaded to Google Drive.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google Drive backup failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRestoreFromDrive() {
    setBusyAction("restore-download");
    try {
      const backup = validateBackupExport(await downloadBackupFromDrive());
      setPendingRestore(backup);
      setConnected(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google Drive restore failed.");
    } finally {
      setBusyAction(null);
    }
  }

  const usagePercent =
    stats?.quota && stats.quota > 0 ? Math.min(100, Math.round((stats.usage / stats.quota) * 100)) : 0;

  return (
    <>
      <section className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">Settings</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Archive controls</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Your library lives locally in this browser. Drive is only used when you choose backup or restore.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Storage
            </h2>
            <Card className="divide-y overflow-hidden">
              <div className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-primary">
                    <HardDrive className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold">Local persistence</p>
                    <p className="text-sm text-muted-foreground">
                      {stats ? `${stats.bookCount} books, ${stats.quoteCount} quotes` : "Checking local data..."}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatBytes(stats?.usage ?? 0)}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {usagePercent}% used
                  </p>
                </div>
              </div>
            </Card>
          </section>

          <section>
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Backup & restore
            </h2>
            <Card className="divide-y overflow-hidden">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-primary">
                    <Cloud className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold">Google Drive</p>
                    <p className="text-sm text-muted-foreground">
                      {connected ? "Connected for this browser session" : "Optional appDataFolder backup"}
                    </p>
                  </div>
                </div>
                {connected ? (
                  <Button variant="outline" onClick={handleDisconnectDrive} disabled={Boolean(busyAction)}>
                    Disconnect
                  </Button>
                ) : (
                  <Button onClick={handleConnectDrive} disabled={Boolean(busyAction)}>
                    <Cloud className="h-4 w-4" aria-hidden="true" />
                    Connect
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 p-5 text-sm">
                <span className="text-muted-foreground">Last successful backup</span>
                <span className="text-right font-semibold">{formatDateTime(lastBackupAt)}</span>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2">
                <Button onClick={handleBackupNow} disabled={Boolean(busyAction)}>
                  <UploadCloud className="h-4 w-4" aria-hidden="true" />
                  {busyAction === "backup" ? "Backing up..." : "Backup now"}
                </Button>
                <Button variant="outline" onClick={handleRestoreFromDrive} disabled={Boolean(busyAction)}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {busyAction === "restore-download" ? "Downloading..." : "Restore backup"}
                </Button>
              </div>
            </Card>
          </section>

          <section>
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              JSON data
            </h2>
            <Card className="divide-y overflow-hidden">
              <button
                type="button"
                onClick={handleExport}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-muted"
                disabled={Boolean(busyAction)}
              >
                <span className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-primary">
                    <Download className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-semibold">Export data</span>
                    <span className="block text-sm text-muted-foreground">Download books and quotes as JSON</span>
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-muted"
                disabled={Boolean(busyAction)}
              >
                <span className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-primary">
                    <Upload className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-semibold">Import data</span>
                    <span className="block text-sm text-muted-foreground">
                      Replace local data from a valid backup file
                    </span>
                  </span>
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImportFile}
              />
            </Card>
          </section>

          <div className="flex items-center justify-center gap-2 pt-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <Database className="h-4 w-4" aria-hidden="true" />
            Reading Notes MVP
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingImport)}
        onOpenChange={(open) => !open && setPendingImport(null)}
        title="Replace local data?"
        description={`This import contains ${pendingImport?.books.length ?? 0} books and ${
          pendingImport?.quotes.length ?? 0
        } quotes. Your current local data will be replaced.`}
        confirmLabel="Replace data"
        destructive
        busy={busyAction === "replace"}
        onConfirm={() => {
          if (!pendingImport) return;
          return replaceWithBackup(pendingImport, "Import completed.");
        }}
      />
      <ConfirmDialog
        open={Boolean(pendingRestore)}
        onOpenChange={(open) => !open && setPendingRestore(null)}
        title="Restore Drive backup?"
        description={`This backup contains ${pendingRestore?.books.length ?? 0} books and ${
          pendingRestore?.quotes.length ?? 0
        } quotes. Your current local data will be replaced.`}
        confirmLabel="Restore backup"
        destructive
        busy={busyAction === "replace"}
        onConfirm={() => {
          if (!pendingRestore) return;
          return replaceWithBackup(pendingRestore, "Google Drive backup restored.");
        }}
      />
    </>
  );
}
