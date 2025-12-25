import ThemeProvider from "@/components/theme/theme-provider"
import { QueryProvider } from "@/lib/query/provider"

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  )
}

export default Providers
