import { type ReactNode } from "react"

import Footer from "@/components/navigation/footer"
import Header from "@/components/navigation/header"

const PublicLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default PublicLayout
