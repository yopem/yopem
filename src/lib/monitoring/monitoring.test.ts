import { describe, expect, it } from "bun:test"

describe("Uptime Calculation", () => {
  it("should calculate uptime percentage correctly", () => {
    const totalSeconds = 30 * 24 * 60 * 60 // 30 days
    const downtimeSeconds = 3600 // 1 hour
    const uptimePercentage =
      ((totalSeconds - downtimeSeconds) / totalSeconds) * 100

    expect(uptimePercentage).toBeCloseTo(99.86, 1)
  })

  it("should return 100% when no downtime", () => {
    const totalSeconds = 24 * 60 * 60 // 1 day
    const downtimeSeconds = 0
    const uptimePercentage =
      ((totalSeconds - downtimeSeconds) / totalSeconds) * 100

    expect(uptimePercentage).toBe(100)
  })

  it("should handle full downtime correctly", () => {
    const totalSeconds = 3600 // 1 hour
    const downtimeSeconds = 3600
    const uptimePercentage =
      ((totalSeconds - downtimeSeconds) / totalSeconds) * 100

    expect(uptimePercentage).toBe(0)
  })
})

describe("Activity Log Filtering", () => {
  it("should filter logs by severity level", () => {
    const logs = [
      { severity: "info" },
      { severity: "warning" },
      { severity: "error" },
      { severity: "critical" },
    ]

    const minSeverity = "warning"
    const severityOrder = ["debug", "info", "warning", "error", "critical"]
    const minIndex = severityOrder.indexOf(minSeverity)

    const filtered = logs.filter(
      (log) => severityOrder.indexOf(log.severity) >= minIndex,
    )

    expect(filtered.length).toBe(3)
    expect(filtered.map((l) => l.severity)).toContain("warning")
    expect(filtered.map((l) => l.severity)).toContain("error")
    expect(filtered.map((l) => l.severity)).toContain("critical")
    expect(filtered.map((l) => l.severity)).not.toContain("info")
  })
})
