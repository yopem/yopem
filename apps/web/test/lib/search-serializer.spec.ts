import { describe, expect, test } from "vite-plus/test"

import { parseSearch, stringifySearch } from "@/lib/search-serializer"

describe("search-serializer", () => {
  test("stringifies arrays as comma-separated values", () => {
    expect(
      stringifySearch({
        categorySlugs: ["images", "video"],
        tagSlugs: ["gpt"],
        page: 2,
      }),
    ).toBe("?categorySlugs=images,video&tagSlugs=gpt&page=2")
  })

  test("omits empty search", () => {
    expect(stringifySearch({})).toBe("")
  })

  test("omits undefined values", () => {
    expect(stringifySearch({ search: undefined, page: 1 })).toBe("?page=1")
  })

  test("parses comma-separated values into arrays", () => {
    expect(parseSearch("?categorySlugs=images,video&tagSlugs=gpt")).toEqual({
      categorySlugs: ["images", "video"],
      tagSlugs: "gpt",
    })
  })

  test("round-trips single and multiple values", () => {
    expect(parseSearch(stringifySearch({ categorySlugs: ["images"] }))).toEqual(
      { categorySlugs: "images" },
    )
    expect(
      parseSearch(
        stringifySearch({ categorySlugs: ["images", "video"], page: 1 }),
      ),
    ).toEqual({ categorySlugs: ["images", "video"], page: "1" })
  })
})
