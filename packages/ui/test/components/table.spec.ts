import { describe, expect, test } from "vite-plus/test"

import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "ui/components/table"

describe("table", () => {
  test("Table is exported", () => {
    expect(Table).toBeDefined()
  })

  test("TableHeader is exported", () => {
    expect(TableHeader).toBeDefined()
  })

  test("TableBody is exported", () => {
    expect(TableBody).toBeDefined()
  })

  test("TableFooter is exported", () => {
    expect(TableFooter).toBeDefined()
  })

  test("TableHead is exported", () => {
    expect(TableHead).toBeDefined()
  })

  test("TableRow is exported", () => {
    expect(TableRow).toBeDefined()
  })

  test("TableCell is exported", () => {
    expect(TableCell).toBeDefined()
  })

  test("TableCaption is exported", () => {
    expect(TableCaption).toBeDefined()
  })
})
