import { describe, expect, test } from "vitest"

import { redisCache } from "cache"

describe("redisCache", () => {
  test("exports a cache instance", () => {
    expect(redisCache).toBeDefined()
    expect(typeof redisCache.getCache).toBe("function")
    expect(typeof redisCache.setCache).toBe("function")
    expect(typeof redisCache.deleteCache).toBe("function")
    expect(typeof redisCache.hasCache).toBe("function")
    expect(typeof redisCache.expireCache).toBe("function")
    expect(typeof redisCache.invalidatePattern).toBe("function")
    expect(typeof redisCache.close).toBe("function")
  })
})
