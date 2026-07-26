import { ORPCError } from "@orpc/server"
import {
  RATE_LIMITS,
  checkRateLimit,
  enforceRateLimit,
} from "server/rate-limit"
import { describe, expect, test } from "vite-plus/test"

describe("checkRateLimit", () => {
  test("allows requests when redis is unavailable", async () => {
    const result = await checkRateLimit(
      () => Promise.resolve(null),
      "key",
      5,
      60000,
    )
    expect(result.ok).toBe(true)
    expect(result.value).toEqual({ isLimited: false, remaining: 5 })
  })

  test("fails closed when requested", async () => {
    const result = await checkRateLimit(
      () => Promise.resolve(null),
      "key",
      5,
      60000,
      {
        failClosed: true,
      },
    )
    expect(result.value).toEqual({ isLimited: true, remaining: 0 })
  })

  test("exports rate limit presets", () => {
    expect(RATE_LIMITS.API_KEY_ADD.maxRequests).toBe(5)
  })
})

describe("enforceRateLimit", () => {
  test("is an exported function", () => {
    expect(typeof enforceRateLimit).toBe("function")
  })

  test("fails open when redis is unavailable", async () => {
    await expect(
      enforceRateLimit(() => Promise.resolve(null), "session-1", "add"),
    ).resolves.toBeUndefined()
  })

  test("does not throw for each action when redis is unavailable", async () => {
    for (const action of ["add", "update", "delete"] as const) {
      await expect(
        enforceRateLimit(() => Promise.resolve(null), "session-1", action),
      ).resolves.toBeUndefined()
    }
  })

  test("throws FORBIDDEN when redis reports limited", async () => {
    const fakeRedis = {
      zremrangebyscore: () => Promise.resolve(0),
      zcard: () => Promise.resolve(100),
      zadd: () => Promise.resolve(1),
      pexpire: () => Promise.resolve(1),
    }
    await expect(
      enforceRateLimit(
        () => Promise.resolve(fakeRedis as never),
        "session-1",
        "add",
      ),
    ).rejects.toThrow(ORPCError)
  })
})
