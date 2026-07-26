import { describe, expect, test } from "vite-plus/test"

import {
  Tabs,
  TabsList,
  TabsTab,
  TabsTrigger,
  TabsPanel,
  TabsContent,
} from "ui/components/tabs"

describe("tabs", () => {
  test("Tabs is exported", () => {
    expect(Tabs).toBeDefined()
  })

  test("TabsList is exported", () => {
    expect(TabsList).toBeDefined()
  })

  test("TabsTab is exported", () => {
    expect(TabsTab).toBeDefined()
  })

  test("TabsTrigger is exported", () => {
    expect(TabsTrigger).toBeDefined()
  })

  test("TabsPanel is exported", () => {
    expect(TabsPanel).toBeDefined()
  })

  test("TabsContent is exported", () => {
    expect(TabsContent).toBeDefined()
  })
})
