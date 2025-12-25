import { Suspense } from "react"

import User from "@/components/user"
import Welcome from "@/components/welcome"

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Suspense fallback={<p>Loading...</p>}>
        <Welcome />
        <User />
      </Suspense>
    </div>
  )
}
