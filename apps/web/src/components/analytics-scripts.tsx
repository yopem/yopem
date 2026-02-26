import { gaMeasurementId, umamiTrackingId } from "@repo/env/client"

const AnalyticsScripts = () => {
  return (
    <>
      {umamiTrackingId && (
        <script
          defer
          src="https://analytics.yopem.com/script.js"
          data-website-id={umamiTrackingId}
        />
      )}
      {gaMeasurementId && (
        <>
          <script
            defer
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaMeasurementId}')`,
            }}
          />
        </>
      )}
    </>
  )
}

export default AnalyticsScripts
