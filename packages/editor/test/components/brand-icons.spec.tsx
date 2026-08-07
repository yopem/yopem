import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/brand-icons"

describe("editor/brand-icons", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.FacebookIcon).toBeDefined()
    expect(mod.TwitterIcon).toBeDefined()
    expect(mod.YoutubeIcon).toBeDefined()
  })
})
