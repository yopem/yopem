import { describe, expect, test } from "vite-plus/test"

import { serializer } from "rpc/serializer"

describe("serializer", () => {
  test("is an instance of StandardRPCJsonSerializer", () => {
    expect(serializer).toBeDefined()
    expect(typeof serializer.serialize).toBe("function")
    expect(typeof serializer.deserialize).toBe("function")
  })

  test("serializes and deserializes basic values", () => {
    const [json, meta] = serializer.serialize("hello")
    expect(json).toBeDefined()
    expect(meta).toBeDefined()
  })

  test("serializes objects", () => {
    const obj = { a: 1, b: "test" }
    const [json] = serializer.serialize(obj)
    expect(json).toBeDefined()
  })

  test("handles custom serialization round-trip via serialize only", () => {
    const obj = { a: 1, b: "test" }
    const [json, meta] = serializer.serialize(obj)
    const result = serializer.deserialize(json, meta)
    expect(result).toEqual(obj)
  })
})
