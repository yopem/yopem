import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

const mockRedis = {
  setex: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  expire: vi.fn(),
  scanStream: vi.fn(),
  pipeline: vi.fn(() => ({ exec: vi.fn() })),
  quit: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
}

vi.mock("ioredis", () => ({
  default: class MockRedis {
    constructor() {
      return mockRedis as never
    }
  },
}))

describe("createRedisCache", () => {
  beforeEach(() => {
    vi.stubEnv("REDIS_URL", "redis://localhost:6379")
    vi.stubEnv("REDIS_KEY_PREFIX", "test:")
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  test("returns null gracefully when redis is disabled", async () => {
    vi.unstubAllEnvs()
    delete process.env.REDIS_URL
    const { createRedisCache } = await import("cache/client")
    const cache = createRedisCache()
    expect(await cache.getCache("key")).toBeNull()
    expect(await cache.hasCache("key")).toBe(false)
    expect(await cache.expireCache("key", 1)).toBe(false)
  })

  test("setCache stores serialized value", async () => {
    const { createRedisCache } = await import("cache/client")
    const cache = createRedisCache()
    await cache.setCache("key", { name: "value" }, 60)
    expect(mockRedis.setex).toHaveBeenCalledWith(
      "key",
      60,
      JSON.stringify({ name: "value" }),
    )
  })

  test("setCache serializes dates", async () => {
    const { createRedisCache } = await import("cache/client")
    const cache = createRedisCache()
    const date = new Date("2024-01-15T00:00:00.000Z")
    await cache.setCache("key", { createdAt: date }, 60)
    expect(mockRedis.setex).toHaveBeenCalledWith(
      "key",
      60,
      JSON.stringify({
        createdAt: { __type: "Date", value: date.toISOString() },
      }),
    )
  })

  test("getCache returns parsed value", async () => {
    mockRedis.get.mockResolvedValueOnce(JSON.stringify({ name: "value" }))
    const { createRedisCache } = await import("cache/client")
    const cache = createRedisCache()
    const value = await cache.getCache("key")
    expect(value).toEqual({ name: "value" })
  })

  test("getCache restores serialized dates", async () => {
    const date = new Date("2024-01-15T00:00:00.000Z")
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify({
        createdAt: { __type: "Date", value: date.toISOString() },
      }),
    )
    const { createRedisCache } = await import("cache/client")
    const cache = createRedisCache()
    const value = await cache.getCache<{ createdAt: Date }>("key")
    expect(value?.createdAt).toEqual(date)
  })

  test("getCache returns null for missing key", async () => {
    mockRedis.get.mockResolvedValueOnce(null)
    const { createRedisCache } = await import("cache/client")
    const cache = createRedisCache()
    expect(await cache.getCache("key")).toBeNull()
  })

  test("deleteCache removes the key", async () => {
    const { createRedisCache } = await import("cache/client")
    const cache = createRedisCache()
    await cache.deleteCache("key")
    expect(mockRedis.del).toHaveBeenCalledWith("key")
  })

  test("hasCache returns true when key exists", async () => {
    mockRedis.exists.mockResolvedValueOnce(1)
    const { createRedisCache } = await import("cache/client")
    const cache = createRedisCache()
    expect(await cache.hasCache("key")).toBe(true)
  })

  test("expireCache updates ttl", async () => {
    mockRedis.expire.mockResolvedValueOnce(1)
    const { createRedisCache } = await import("cache/client")
    const cache = createRedisCache()
    expect(await cache.expireCache("key", 120)).toBe(true)
    expect(mockRedis.expire).toHaveBeenCalledWith("key", 120)
  })
})
