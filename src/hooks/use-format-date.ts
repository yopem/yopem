import { useCallback } from "react"
import dayjs from "dayjs"

const useFormatDate = () => {
  const formatDate = useCallback(
    (date: Date | string | null | undefined, format = "YYYY-MM-DD") => {
      if (!date) return ""
      return dayjs(date).format(format)
    },
    [],
  )

  const formatDateTime = useCallback(
    (date: Date | string | null | undefined) => {
      if (!date) return ""
      return dayjs(date).format("MMM D, YYYY h:mm A")
    },
    [],
  )

  const formatDateOnly = useCallback(
    (date: Date | string | null | undefined) => {
      if (!date) return ""
      return dayjs(date).format("MMM D, YYYY")
    },
    [],
  )

  const formatTimeOnly = useCallback(
    (date: Date | string | null | undefined) => {
      if (!date) return ""
      return dayjs(date).format("h:mm A")
    },
    [],
  )

  const formatRelative = useCallback(
    (date: Date | string | null | undefined) => {
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
    },
    [],
  )

  return {
    formatDate,
    formatDateTime,
    formatDateOnly,
    formatTimeOnly,
    formatRelative,
  }
}

export default useFormatDate
