import { RATE_LIMITS, checkRateLimit } from "server/rate-limit"
import { describe, expect, test } from "vitest"

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
