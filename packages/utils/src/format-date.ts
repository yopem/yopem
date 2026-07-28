import dayjs from "dayjs"

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "N/A"
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDateOnly(date: Date | string | null | undefined) {
  if (!date) return ""
  return dayjs(date).format("MMM D, YYYY")
}
