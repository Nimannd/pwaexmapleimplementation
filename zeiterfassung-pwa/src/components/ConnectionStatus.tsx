import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

export const ConnectionStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOffline, setShowOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Only show "back online" if we were previously offline
      if (!isOnline) {
        setShowBackOnline(true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  return (
    <>
      <Snackbar
        open={showOffline}
        autoHideDuration={6000}
        onClose={() => setShowOffline(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowOffline(false)} 
          severity="warning" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          You are offline. The app will continue to work with locally stored data.
        </Alert>
      </Snackbar>

      <Snackbar
        open={showBackOnline}
        autoHideDuration={3000}
        onClose={() => setShowBackOnline(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowBackOnline(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          You are back online!
        </Alert>
      </Snackbar>
    </>
  );
};