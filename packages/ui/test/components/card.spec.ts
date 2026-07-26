import { describe, expect, test } from "vite-plus/test"

import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "ui/components/card"

describe("card", () => {
  test("Card is exported", () => {
    expect(Card).toBeDefined()
  })

  test("CardHeader is exported", () => {
    expect(CardHeader).toBeDefined()
  })

  test("CardFooter is exported", () => {
    expect(CardFooter).toBeDefined()
  })

  test("CardTitle is exported", () => {
    expect(CardTitle).toBeDefined()
  })

  test("CardAction is exported", () => {
    expect(CardAction).toBeDefined()
  })

  test("CardDescription is exported", () => {
    expect(CardDescription).toBeDefined()
  })

  test("CardContent is exported", () => {
    expect(CardContent).toBeDefined()
  })
})
