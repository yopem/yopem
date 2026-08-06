import { ORPCError } from "@orpc/server"
import { describe, expect, test } from "bun:test"
import {
  RATE_LIMITS,
  checkRateLimit,
  enforceRateLimit,
} from "server/rate-limit"

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

  test("fails open when redis is unavailable", () => {
    expect(
      enforceRateLimit(() => Promise.resolve(null), "session-1", "add"),
    ).resolves.toBeUndefined()
  })

  test("does not throw for each action when redis is unavailable", () => {
    for (const action of ["add", "update", "delete"] as const) {
      expect(
        enforceRateLimit(() => Promise.resolve(null), "session-1", action),
      ).resolves.toBeUndefined()
    }
  })

  test("throws FORBIDDEN when redis reports limited", () => {
    const fakeRedis = {
      send: (command: string) =>
        command === "ZCARD" ? Promise.resolve(100) : Promise.resolve(1),
    }
    expect(
      enforceRateLimit(
        () => Promise.resolve(fakeRedis as never),
        "session-1",
        "add",
      ),
    ).rejects.toThrow(ORPCError)
  })
})
