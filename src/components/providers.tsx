import ThemeProvider from "@/components/theme/theme-provider"
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast"
import { QueryProvider } from "@/lib/query/provider"

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <QueryProvider>
        <ToastProvider>
          <AnchoredToastProvider>{children}</AnchoredToastProvider>
        </ToastProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}

export default Providers
