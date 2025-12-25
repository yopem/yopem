import { Suspense } from "react"

import Welcome from "@/components/welcome"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl">Coming soon ...</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <Welcome />
      </Suspense>
    </div>
  )
}
