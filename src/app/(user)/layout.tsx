import { Suspense, type ReactNode } from "react"

export default function UserRootLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
}
