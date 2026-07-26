import {
  idParamSchema,
  jsonOkResponse,
  successSchema,
} from "server/routes/common"
import { describe, expect, test } from "vitest"

describe("common route schemas", () => {
  test("idParamSchema validates an id", () => {
    expect(idParamSchema.safeParse({ id: "123" }).success).toBe(true)
  })

  test("successSchema validates a success flag", () => {
    expect(successSchema.safeParse({ success: true }).success).toBe(true)
  })

  test("jsonOkResponse returns a response shape", () => {
    const response = jsonOkResponse()
    expect(response.description).toBe("Success")
    expect(response.content["application/json"]).toBeDefined()
  })
})
