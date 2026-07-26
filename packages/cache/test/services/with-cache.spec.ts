import { describe, expect, test, vi } from "vite-plus/test"

import { getOrCompute } from "cache/services/with-cache"

describe("getOrCompute", () => {
  test("returns cached value without calling compute", async () => {
    const cache = {
      getCache: vi.fn().mockResolvedValue("cached"),
      setCache: vi.fn(),
    }
    const compute = vi.fn().mockResolvedValue("computed")

    const value = await getOrCompute(cache as never, "key", compute, 60)

    expect(value).toBe("cached")
    expect(compute).not.toHaveBeenCalled()
    expect(cache.setCache).not.toHaveBeenCalled()
  })

  test("computes, stores, and returns value when cache is empty", async () => {
    const cache = {
      getCache: vi.fn().mockResolvedValue(null),
      setCache: vi.fn(),
    }
    const compute = vi.fn().mockResolvedValue("computed")

    const value = await getOrCompute(cache as never, "key", compute, 60)

    expect(value).toBe("computed")
    expect(compute).toHaveBeenCalledOnce()
    expect(cache.setCache).toHaveBeenCalledWith("key", "computed", 60)
  })

  test("uses default ttl when ttl is not provided", async () => {
    const cache = {
      getCache: vi.fn().mockResolvedValue(null),
      setCache: vi.fn(),
    }
    const compute = vi.fn().mockResolvedValue("computed")

    await getOrCompute(cache as never, "key", compute)

    expect(cache.setCache).toHaveBeenCalledWith("key", "computed", 3601)
  })
})
