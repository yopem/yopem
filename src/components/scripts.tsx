import { GoogleAnalytics } from "@next/third-parties/google"
import Script from "next/script"

import { gaMeasurementId, umamiTrackingId } from "@/lib/env/client"

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
