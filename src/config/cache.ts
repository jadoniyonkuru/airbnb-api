// simple in-memory cache
const cache = new Map<string, { data: unknown; expiresAt: number }>();

// get data from cache
export function getCache(key: string): unknown | null {
  const entry = cache.get(key);

  if (!entry) return null;

  // check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

// set data in cache with TTL in seconds
export function setCache(key: string, data: unknown, ttlSeconds: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

// delete a specific cache key
export function deleteCache(key: string): void {
  cache.delete(key);
}

// delete all keys that start with a prefix
export function deleteCacheByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}