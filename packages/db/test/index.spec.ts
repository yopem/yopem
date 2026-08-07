import { describe, expect, test, vi } from "vite-plus/test"

const { capturedOptions } = vi.hoisted(() => ({
  capturedOptions: {
    current: undefined as Record<string, unknown> | undefined,
  },
}))

vi.mock("bun", () => ({
  SQL: class SQLMock {
    constructor(opts: Record<string, unknown>) {
      capturedOptions.current = opts
    }
  },
}))

import { db } from "db"

describe("db index", () => {
  test("exports a drizzle db instance", () => {
    expect(db).toBeDefined()
  })

  test("filters out idle timeout error messages in onclose handler", () => {
    expect(capturedOptions.current).toBeDefined()
    const onclose = capturedOptions.current?.onclose as
      | ((error?: unknown) => void)
      | undefined
    expect(onclose).toBeTypeOf("function")

    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined)

    onclose?.(new Error("Idle timeout reached after 30s"))
    expect(errorSpy).not.toHaveBeenCalled()

    onclose?.(new Error("Connection reset by peer"))
    expect(errorSpy).toHaveBeenCalledWith(
      "Database connection closed: Connection reset by peer",
    )

    errorSpy.mockRestore()
  })
})
