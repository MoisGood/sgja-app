import { offlineStore } from './offlineStore';
import { supabase } from '../lib/supabase';

type SyncStatus = 'online' | 'offline' | 'syncing';

let status: SyncStatus = navigator.onLine ? 'online' : 'offline';
const listeners: Set<(s: SyncStatus) => void> = new Set();
let processing = false;

function notify(s: SyncStatus) {
  status = s;
  listeners.forEach(fn => fn(s));
}

export const syncEngine = {
  get status() { return status; },

  subscribe(fn: (s: SyncStatus) => void) {
    listeners.add(fn);
    fn(status);
    return () => { listeners.delete(fn); };
  },

  async processQueue() {
    if (processing) return;
    processing = true;
    notify('syncing');

    try {
      const queue = await offlineStore.getPendingSync();
      for (const item of queue) {
        try {
          if (item.operation === 'delete') {
            await supabase.from(item.table).delete().eq('id', item.record_id);
          } else {
            const exists = await supabase.from(item.table).select('id').eq('id', item.record_id).maybeSingle();
            if (exists.data) {
              await supabase.from(item.table).update(item.data).eq('id', item.record_id);
            } else {
              await supabase.from(item.table).insert(item.data);
            }
          }
          await offlineStore.markSynced(item.id!);
        } catch (err) {
          console.warn(`sync failed for ${item.table}/${item.record_id}:`, err);
        }
      }
    } finally {
      processing = false;
      notify(navigator.onLine ? 'online' : 'offline');
    }
  },

  start() {
    const go = () => {
      notify(navigator.onLine ? 'online' : 'offline');
      if (navigator.onLine) this.processQueue();
    };
    window.addEventListener('online', go);
    window.addEventListener('offline', go);
    go();
    return () => {
      window.removeEventListener('online', go);
      window.removeEventListener('offline', go);
    };
  },
};
