import dayjs from "dayjs"

export const formatDate = (
  date: Date | string | null | undefined,
  format = "YYYY-MM-DD",
) => {
  if (!date) return ""
  return dayjs(date).format(format)
}

export const formatDateTime = (date: Date | string | null | undefined) => {
  if (!date) return ""
  return dayjs(date).format("MMM D, YYYY h:mm A")
}

export const formatDateOnly = (date: Date | string | null | undefined) => {
  if (!date) return ""
  return dayjs(date).format("MMM D, YYYY")
}

export const formatTimeOnly = (date: Date | string | null | undefined) => {
  if (!date) return ""
  return dayjs(date).format("h:mm A")
}

export const formatRelative = (date: Date | string | null | undefined) => {
  if (!date) return ""
  const now = dayjs()
  const target = dayjs(date)
  const diffInDays = now.diff(target, "day")

  if (diffInDays === 0) return "Today"
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}
