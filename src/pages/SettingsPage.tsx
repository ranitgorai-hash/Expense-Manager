import { useRef, useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Switch,
  Button,
  Stack,
  Divider,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import { useApp } from '../hooks/useApp';
import { useBudgetData } from '../hooks/useBudget';
import { useTour } from '../hooks/useTour';
import PageHeader from '../components/common/PageHeader';
import { exportAll, importAll, type FullExport } from '../db';
import { exportToExcel } from '../utils/excel';
import type { AppMode } from '../types';
import { encryptJson, decryptJson, isEncryptedPayload, type EncryptedPayload } from '../utils/crypto';
import { isDriveConfigured, getAccessToken, uploadBackup, downloadBackup, disconnectDrive } from '../utils/drive';

export default function SettingsPage() {
  const { settings, updateSettings, expenses, categories, friends, settlements } = useApp();
  const { budgets, savingsGoals } = useBudgetData();
  const { start: startTour } = useTour();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [replayDialogOpen, setReplayDialogOpen] = useState(false);

  // --- Google Drive backup state ---
  const driveConfigured = isDriveConfigured();
  const [driveBusy, setDriveBusy] = useState<'backup' | 'restore' | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveNotice, setDriveNotice] = useState<string | null>(null);
  // Passphrase dialog: 'backup' when encrypting a fresh backup, 'restore' when decrypting one.
  const [passDialog, setPassDialog] = useState<'backup' | 'restore' | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [passphraseConfirm, setPassphraseConfirm] = useState('');
  const [pendingRestorePayload, setPendingRestorePayload] = useState<EncryptedPayload | null>(null);

  const handleJsonExport = async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string) as FullExport;
        await importAll(data);
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const runDriveBackup = async (usePassphrase: string | null) => {
    setDriveError(null);
    setDriveNotice(null);
    setDriveBusy('backup');
    try {
      const data = await exportAll();
      const content = usePassphrase
        ? JSON.stringify(await encryptJson(data, usePassphrase))
        : JSON.stringify(data);
      const token = await getAccessToken(true);
      const result = await uploadBackup(token, content, settings?.driveFileId);
      await updateSettings({
        driveConnected: true,
        driveEncrypted: !!usePassphrase,
        driveFileId: result.fileId,
        driveLastBackupAt: Date.now(),
      });
      setDriveNotice('Backup uploaded to Google Drive.');
    } catch (err) {
      setDriveError(err instanceof Error ? err.message : 'Backup failed.');
    } finally {
      setDriveBusy(null);
    }
  };

  const handleBackupClick = () => {
    if (settings?.driveEncrypted || !settings?.driveConnected) {
      // First-ever backup or an already-encrypted backup: ask for a passphrase.
      // (Encryption is opt-in per-account, decided the first time; toggled via this dialog.)
      setPassphrase('');
      setPassphraseConfirm('');
      setPassDialog('backup');
    } else {
      runDriveBackup(null);
    }
  };

  const runDriveRestore = async () => {
    setDriveError(null);
    setDriveNotice(null);
    setDriveBusy('restore');
    try {
      const token = await getAccessToken(true);
      const fileId = settings?.driveFileId;
      if (!fileId) throw new Error('No backup found on Drive yet — back up first.');
      const raw = await downloadBackup(token, fileId);
      const parsed = JSON.parse(raw);
      if (isEncryptedPayload(parsed)) {
        setPendingRestorePayload(parsed);
        setPassphrase('');
        setPassDialog('restore');
        setDriveBusy(null);
        return;
      }
      await importAll(parsed as FullExport);
      setDriveNotice('Restored from Google Drive backup.');
    } catch (err) {
      setDriveError(err instanceof Error ? err.message : 'Restore failed.');
    } finally {
      setDriveBusy((b) => (b === 'restore' ? null : b));
    }
  };

  const confirmPassphraseDialog = async () => {
    if (passDialog === 'backup') {
      if (passphrase && passphrase !== passphraseConfirm) {
        setDriveError('Passphrases do not match.');
        return;
      }
      setPassDialog(null);
      await runDriveBackup(passphrase || null);
    } else if (passDialog === 'restore' && pendingRestorePayload) {
      setDriveBusy('restore');
      try {
        const data = await decryptJson<FullExport>(pendingRestorePayload, passphrase);
        await importAll(data);
        setDriveNotice('Restored from Google Drive backup.');
        setPassDialog(null);
        setPendingRestorePayload(null);
      } catch {
        setDriveError('Wrong passphrase, or the backup is corrupted.');
      } finally {
        setDriveBusy(null);
      }
    }
  };

  const handleDisconnectDrive = async () => {
    disconnectDrive();
    await updateSettings({ driveConnected: false, driveFileId: undefined, driveLastBackupAt: undefined });
    setDriveNotice(null);
    setDriveError(null);
  };

  if (!settings) return null;

  return (
    <Box>
      <PageHeader title="Settings" />

      <List disablePadding>
        <ListItem divider>
          <ListItemText primary="Dark mode" />
          <Switch
            checked={settings.darkMode}
            onChange={(e) => updateSettings({ darkMode: e.target.checked })}
          />
        </ListItem>
      </List>

      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3, mb: 1 }}>
        Backup &amp; Export
      </Typography>
      <Stack spacing={1.5} alignItems="flex-start">
        <Button variant="outlined" onClick={handleJsonExport}>Export local backup (JSON)</Button>
        <Button variant="outlined" component="label">
          Import local backup (JSON)
          <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleJsonImport} />
        </Button>
        <Button
          variant="outlined"
          onClick={() => exportToExcel(expenses, categories, friends, settlements, budgets, savingsGoals)}
        >
          Export to Excel
        </Button>
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Guided Tour
      </Typography>
      <Button variant="outlined" onClick={() => setReplayDialogOpen(true)}>
        Replay guided tour
      </Button>

      <Dialog open={replayDialogOpen} onClose={() => setReplayDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Replay which tour?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Each mode has its own guided tour tailored to its features.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              startTour('single' as AppMode);
              setReplayDialogOpen(false);
            }}
          >
            Single Mode tour
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              startTour('group' as AppMode);
              setReplayDialogOpen(false);
            }}
          >
            Group Mode tour
          </Button>
        </DialogActions>
      </Dialog>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Google Drive Backup
      </Typography>

      {!driveConfigured ? (
        <Alert severity="info">
          Google Drive backup isn't configured for this deployment (missing
          <code> VITE_GOOGLE_CLIENT_ID</code>). Everything else keeps working fully offline.
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            Manual, on-demand backup to your own Google Drive — only this app can see the one
            file it creates. Optionally encrypt it with a passphrase (AES-256-GCM) before it
            ever leaves your device, so not even Google can read it.
          </Typography>

          {settings.driveConnected && (
            <Typography variant="caption" color="text.secondary">
              {settings.driveEncrypted ? '🔒 Encrypted backup' : 'Unencrypted backup'} ·{' '}
              {settings.driveLastBackupAt
                ? `Last backed up ${new Date(settings.driveLastBackupAt).toLocaleString('en-IN')}`
                : 'No backup yet'}
            </Typography>
          )}

          {driveError && <Alert severity="error" onClose={() => setDriveError(null)}>{driveError}</Alert>}
          {driveNotice && <Alert severity="success" onClose={() => setDriveNotice(null)}>{driveNotice}</Alert>}

          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button
              variant="contained"
              onClick={handleBackupClick}
              disabled={driveBusy !== null}
              startIcon={driveBusy === 'backup' ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {settings.driveConnected ? 'Back up now' : 'Connect & back up'}
            </Button>
            {settings.driveConnected && (
              <>
                <Button
                  variant="outlined"
                  onClick={runDriveRestore}
                  disabled={driveBusy !== null}
                  startIcon={driveBusy === 'restore' ? <CircularProgress size={16} color="inherit" /> : undefined}
                >
                  Restore from Drive
                </Button>
                <Button variant="text" color="inherit" onClick={handleDisconnectDrive} disabled={driveBusy !== null}>
                  Disconnect
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      )}

      <Dialog open={passDialog !== null} onClose={() => setPassDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          {passDialog === 'backup' ? 'Encrypt this backup? (optional)' : 'Enter passphrase'}
        </DialogTitle>
        <DialogContent>
          {passDialog === 'backup' ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Leave blank to upload as plain JSON. Set a passphrase to encrypt it with
                AES-256-GCM first — write it down somewhere safe, it's never stored and can't be
                recovered if you forget it.
              </Typography>
              <TextField
                label="Passphrase (optional)"
                type="password"
                fullWidth
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Confirm passphrase"
                type="password"
                fullWidth
                value={passphraseConfirm}
                onChange={(e) => setPassphraseConfirm(e.target.value)}
                disabled={!passphrase}
              />
            </>
          ) : (
            <TextField
              label="Passphrase"
              type="password"
              fullWidth
              autoFocus
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPassDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={confirmPassphraseDialog}>
            {passDialog === 'backup' ? (passphrase ? 'Encrypt & back up' : 'Back up (unencrypted)') : 'Decrypt & restore'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
