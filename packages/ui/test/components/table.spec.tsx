import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/table"

describe("ui/components/table", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Table).toBeDefined()
    expect(mod.TableHeader).toBeDefined()
    expect(mod.TableBody).toBeDefined()
    expect(mod.TableFooter).toBeDefined()
    expect(mod.TableRow).toBeDefined()
  })
})
