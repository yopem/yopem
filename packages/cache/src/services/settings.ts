import type { RedisCache } from "cache/client"
import { getOrCompute } from "cache/services/with-cache"

const SETTINGS_CACHE_TTL = 300

export async function getSettingCache<T>(
  cache: RedisCache,
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = SETTINGS_CACHE_TTL,
): Promise<T> {
  return await getOrCompute(cache, `settings:${key}`, fetcher, ttlSeconds)
}

export function setSettingCache<T>(
  cache: RedisCache,
  key: string,
  value: T,
  ttlSeconds = SETTINGS_CACHE_TTL,
): void {
  void cache.setCache(`settings:${key}`, value, ttlSeconds)
}

export function deleteSettingCache(cache: RedisCache, key: string): void {
  void cache.deleteCache(`settings:${key}`)
}

export function invalidateModelCache(cache: RedisCache): void {
  void cache.invalidatePattern("models:*")
}
