const PREFIX = 'sgja_cache:';
const DEFAULT_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  ts: number;
  ttl: number;
}

export function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts > entry.ttl) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return entry.data;
  } catch { return null; }
}

export function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL_MS): void {
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now(), ttl };
    localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch { /* quota exceeded, ignore */ }
}

export function clearCache(key: string): void {
  localStorage.removeItem(PREFIX + key);
}

export function clearAllCache(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
}

export function cacheKey(...parts: string[]): string {
  return parts.join(':');
}
