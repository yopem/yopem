import { describe, expect, test } from "vite-plus/test"

import { toggleAllIds, toggleId } from "@/lib/utils/toggle-id"

describe("toggleId", () => {
  test("adds an id not present in the list", () => {
    expect(toggleId(["a", "b"], "c")).toEqual(["a", "b", "c"])
  })

  test("removes an id already present in the list", () => {
    expect(toggleId(["a", "b"], "a")).toEqual(["b"])
  })

  test("returns a new array without mutating the input", () => {
    const ids = ["a"]
    const result = toggleId(ids, "b")
    expect(result).not.toBe(ids)
    expect(ids).toEqual(["a"])
  })
})

describe("toggleAllIds", () => {
  test("adds all visible ids when not all are selected", () => {
    expect(toggleAllIds(["a"], ["a", "b"], false)).toEqual(["a", "b"])
  })

  test("deduplicates when adding visible ids", () => {
    expect(toggleAllIds(["a", "b"], ["b", "c"], false)).toEqual(["a", "b", "c"])
  })

  test("removes all visible ids when all are selected", () => {
    expect(toggleAllIds(["a", "b", "c"], ["a", "b"], true)).toEqual(["c"])
  })
})
