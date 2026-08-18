/**
 * Google Drive manual backup.
 *
 * Scope: `drive.file` — the narrowest scope Google offers. It only ever lets this app see
 * files *it* created, not the user's whole Drive. There is no ambient access and no
 * background sync: every call here happens because the user explicitly clicked
 * "Backup now" or "Restore from Drive" in Settings.
 *
 * Auth: Google Identity Services (GIS) token client (OAuth2 implicit flow, browser-only,
 * no client secret). The access token lives in memory for the current session only —
 * nothing is persisted except the (optional) Drive fileId of the backup, so future
 * backups update the same file instead of creating duplicates.
 */

const BACKUP_FILENAME = 'expense-manager-backup.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GIS_SRC = 'https://accounts.google.com/gsi/client';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }): { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
    };
  }
}

let gisLoadPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script.'));
    document.head.appendChild(script);
  });
  return gisLoadPromise;
}

export function isDriveConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Requests an access token. `interactive: true` shows the Google consent popup (needed the
 * first time, or once the cached token expires); `interactive: false` fails silently if no
 * valid token is cached, letting callers decide whether to prompt the user.
 */
export async function getAccessToken(interactive: boolean): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) {
    throw new Error('Google Drive backup is not configured (VITE_GOOGLE_CLIENT_ID missing).');
  }
  await loadGis();
  if (!interactive) {
    throw new Error('No cached Drive session — interactive sign-in required.');
  }
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error || 'Google sign-in was cancelled or failed.'));
          return;
        }
        // GIS doesn't return expires_in in this callback shape reliably across versions;
        // treat the token as valid for 55 minutes (Google tokens last ~60).
        cachedToken = { token: resp.access_token, expiresAt: Date.now() + 55 * 60 * 1000 };
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: '' });
  });
}

export function disconnectDrive(): void {
  cachedToken = null;
}

/** Finds the existing backup file (if any) by name. Returns its Drive fileId or null. */
async function findBackupFileId(token: string): Promise<string | null> {
  const params = new URLSearchParams({
    q: `name='${BACKUP_FILENAME}' and trashed=false`,
    fields: 'files(id,name,modifiedTime)',
    spaces: 'drive',
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive lookup failed (${res.status}).`);
  const data = await res.json();
  return data.files?.[0]?.id ?? null;
}

export interface DriveUploadResult {
  fileId: string;
  modifiedTime?: string;
}

/**
 * Uploads (or updates, if a backup already exists) the given content as the backup file.
 * `content` is a plain string — callers pass either raw JSON or an encrypted-payload JSON
 * string; this function has no opinion on encryption.
 */
export async function uploadBackup(
  token: string,
  content: string,
  knownFileId?: string
): Promise<DriveUploadResult> {
  const fileId = knownFileId ?? (await findBackupFileId(token));
  const metadata = { name: BACKUP_FILENAME, mimeType: 'application/json' };
  const boundary = 'expmgr-backup-boundary';
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;

  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const res = await fetch(url, {
    method: fileId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) throw new Error(`Drive upload failed (${res.status}).`);
  const data = await res.json();
  return { fileId: data.id, modifiedTime: data.modifiedTime };
}

/** Downloads and returns the raw text content of the backup file. */
export async function downloadBackup(token: string, fileId: string): Promise<string> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive download failed (${res.status}).`);
  return res.text();
}

export { findBackupFileId };
