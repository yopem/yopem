import dayjs from "dayjs"

export const formatDateTime = (date: Date | string | null | undefined) => {
  if (!date) return ""
  return dayjs(date).format("MMM D, YYYY h:mm A")
}

export const formatDateOnly = (date: Date | string | null | undefined) => {
  if (!date) return ""
  return dayjs(date).format("MMM D, YYYY")
}
