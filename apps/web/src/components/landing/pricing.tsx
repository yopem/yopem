import { CheckCircleIcon } from "lucide-react"

const Pricing = () => {
  return (
    <section className="bg-background border-border/50 w-full border-t py-24">
      <div className="container mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="mb-16 text-center">
          <h2 className="text-foreground mb-4 text-3xl font-semibold tracking-tight md:text-5xl">
            Simple Credit-Based Pricing
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg/relaxed">
            Pay only for what you use with our flexible credit system. No
            subscriptions, no hidden fees.
          </p>
        </div>
        <div className="mx-auto max-w-[900px]">
          <div className="border-border/50 bg-card rounded-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="relative flex flex-col items-center gap-8 overflow-hidden rounded-3xl p-8 md:flex-row md:gap-12 md:p-12">
              <div className="bg-muted/30 pointer-events-none absolute -top-32 -right-32 size-96 rounded-full blur-[80px]" />
              <div className="z-10 flex-1 text-center md:text-left">
                <div className="bg-muted text-foreground mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                  <span className="bg-foreground size-1.5 rounded-full" />
                  Pay As You Go
                </div>
                <h3 className="text-foreground mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
                  Simple, Transparent Credits
                </h3>
                <p className="text-muted-foreground mb-8 text-lg/relaxed">
                  Purchase credits and use them for AI operations. Clear pricing
                  with no hidden fees or complicated billing structures.
                </p>
              </div>
              <div className="border-border/50 bg-background/50 z-10 w-full rounded-2xl border p-8 md:w-[400px]">
                <ul className="space-y-5">
                  <li className="flex items-start">
                    <CheckCircleIcon className="text-muted-foreground mt-0.5 mr-4 size-5" />
                    <div>
                      <span className="text-foreground block font-medium">
                        AI Tools Access
                      </span>
                      <span className="text-muted-foreground text-sm/relaxed">
                        Use credits across all AI tools
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="text-muted-foreground mt-0.5 mr-4 size-5" />
                    <div>
                      <span className="text-foreground block font-medium">
                        Flexible Usage
                      </span>
                      <span className="text-muted-foreground text-sm/relaxed">
                        Credits never expire - use them at your own pace
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="text-muted-foreground mt-0.5 mr-4 size-5" />
                    <div>
                      <span className="text-foreground block font-medium">
                        Priority Support
                      </span>
                      <span className="text-muted-foreground text-sm/relaxed">
                        Get help when you need it with responsive support
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Pricing
