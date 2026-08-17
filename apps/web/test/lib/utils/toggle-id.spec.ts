import { describe, expect, test } from "vite-plus/test"

import { toggleId } from "@/lib/utils/toggle-id"

describe("toggleId", () => {
  test("adds an id when absent", () => {
    expect(toggleId(["a"], "b")).toEqual(["a", "b"])
  })

  test("removes an id when present", () => {
    expect(toggleId(["a", "b"], "a")).toEqual(["b"])
  })

  test("handles empty initial list", () => {
    expect(toggleId([], "a")).toEqual(["a"])
  })

  test("does not mutate the input array", () => {
    const ids = ["a"]
    toggleId(ids, "b")
    expect(ids).toEqual(["a"])
  })
})
