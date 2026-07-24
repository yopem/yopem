import type { RedisCache } from "cache/client"

export async function getOrCompute<T>(
  cache: RedisCache,
  key: string,
  compute: () => Promise<T>,
  ttlSeconds = 3601,
): Promise<T> {
  const cached = await cache.getCache<T>(key)
  if (cached !== null) return cached

  const value = await compute()
  void cache.setCache(key, value, ttlSeconds)
  return value
}
