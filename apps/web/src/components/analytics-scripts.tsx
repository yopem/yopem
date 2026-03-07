import { useEffect } from "react"
import { gaMeasurementId, umamiTrackingId } from "~env/client"

const AnalyticsScripts = () => {
  useEffect(() => {
    if (!gaMeasurementId) return

    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args)
    }
    window.gtag("js", new Date())
    window.gtag("config", gaMeasurementId)

    const script = document.createElement("script")
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`
    script.async = true
    document.head.appendChild(script)
  }, [gaMeasurementId])

  useEffect(() => {
    if (!umamiTrackingId) return

    const script = document.createElement("script")
    script.src = "https://analytics.yopem.com/script.js"
    script.setAttribute("data-website-id", umamiTrackingId)
    script.defer = true
    document.head.appendChild(script)
  }, [umamiTrackingId])

  return null
}

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

export default AnalyticsScripts
