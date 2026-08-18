import { useEffect, useState } from 'react';
import { Snackbar, Button, Alert } from '@mui/material';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Check for updates roughly once an hour while the app is open.
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
    setShowInstallBanner(false);
  };

  return (
    <>
      <Snackbar open={needRefresh} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={() => updateServiceWorker(true)}>
              Reload
            </Button>
          }
          onClose={() => setNeedRefresh(false)}
        >
          A new version is ready.
        </Alert>
      </Snackbar>

      <Snackbar
        open={offlineReady}
        autoHideDuration={4000}
        onClose={() => setOfflineReady(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setOfflineReady(false)}>
          Ready to work offline.
        </Alert>
      </Snackbar>

      <Snackbar
        open={showInstallBanner}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          action={
            <>
              <Button color="inherit" size="small" onClick={handleInstall}>Install</Button>
              <Button color="inherit" size="small" onClick={() => setShowInstallBanner(false)}>Later</Button>
            </>
          }
        >
          Install Expense Manager for quick, full-screen access.
        </Alert>
      </Snackbar>
    </>
  );
}
