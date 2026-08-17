import { describe, expect, test } from "vite-plus/test"

import { serializer } from "rpc/serializer"

describe("serializer", () => {
  test("exports a StandardRPCJsonSerializer instance", () => {
    expect(serializer).toBeDefined()
    expect(typeof serializer.serialize).toBe("function")
    expect(typeof serializer.deserialize).toBe("function")
  })

  test("serializes and deserializes standard object payload", () => {
    const payload = { foo: "bar", num: 123 }
    const [json, meta] = serializer.serialize(payload)
    const result = serializer.deserialize(json, meta)
    expect(result).toEqual(payload)
  })
})
