import { useEffect, useState } from 'react';
import { syncEngine } from '../services/syncEngine';
import { offlineStore } from '../services/offlineStore';

type SyncStatus = 'online' | 'offline' | 'syncing';

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>(syncEngine.status);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsub = syncEngine.subscribe(setStatus);
    return () => unsub();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const queue = await offlineStore.getPendingSync();
      setPendingCount(queue.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return { status, pendingCount, isOnline: status !== 'offline', isSyncing: status === 'syncing' };
}
