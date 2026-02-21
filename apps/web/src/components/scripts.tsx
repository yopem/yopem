import { GoogleAnalytics } from "@next/third-parties/google"
import { gaMeasurementId, umamiTrackingId } from "@repo/env/client"
import Script from "next/script"

const Scripts = () => {
  return (
    <>
      <Script
        src="https://analytics.yopem.com/script.js"
        data-website-id={umamiTrackingId}
        strategy="afterInteractive"
      />
      <GoogleAnalytics gaId={gaMeasurementId} />
    </>
  )
}

export default Scripts
