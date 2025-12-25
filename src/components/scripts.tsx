import { GoogleAnalytics } from "@next/third-parties/google"

import { gaMeasurementId, umamiTrackingId } from "@/lib/env/client"

const Scripts = () => {
  return (
    <>
      <script
        defer
        src="https://analytics.yopem.com/script.js"
        data-website-id={umamiTrackingId}
      ></script>
      <GoogleAnalytics gaId={gaMeasurementId} />
    </>
  )
}

export default Scripts
