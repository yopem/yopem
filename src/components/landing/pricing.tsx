import { CheckCircle as CheckCircleIcon } from "lucide-react"

const Pricing = () => {
  return (
    <section className="bg-card w-full border-t py-20">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tighter">
            Simple Credit-Based Pricing
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            Pay only for what you use with our flexible credit system. No
            subscriptions, no hidden fees.
          </p>
        </div>
        <div className="mx-auto max-w-4xl">
          <div className="from-muted/50 to-muted rounded-2xl border bg-gradient-to-br p-1">
            <div className="bg-card relative flex flex-col items-center gap-8 overflow-hidden rounded-xl p-8 md:flex-row md:gap-12 md:p-12">
              <div className="bg-muted/50 pointer-events-none absolute -top-16 -right-16 -mt-16 -mr-16 rounded-full p-32 blur-3xl" />
              <div className="z-10 flex-1 text-center md:text-left">
                <div className="bg-muted text-foreground mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase">
                  <span className="bg-primary size-2 rounded-full" />
                  Pay As You Go
                </div>
                <h3 className="text-foreground mb-4 text-3xl font-bold md:text-4xl">
                  Simple, Transparent Credits
                </h3>
                <p className="text-muted-foreground mb-8 text-lg">
                  Purchase credits and use them for AI operations. Clear pricing
                  with no hidden fees or complicated billing structures.
                </p>
              </div>
              <div className="border-border/50 bg-muted/50 z-10 w-full rounded-xl border p-6 md:w-1/2">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircleIcon className="text-primary mt-0.5 mr-3 h-5 w-5" />
                    <div>
                      <span className="text-foreground block font-bold">
                        AI Tools Access
                      </span>
                      <span className="text-muted-foreground text-sm">
                        Use credits across all AI tools
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="text-primary mt-0.5 mr-3 h-5 w-5" />
                    <div>
                      <span className="text-foreground block font-bold">
                        Flexible Usage
                      </span>
                      <span className="text-muted-foreground text-sm">
                        Credits never expire - use them at your own pace
                      </span>
                    </div>
                  </li>
                  {/* <li className="flex items-start"> */}
                  {/*   <CheckCircleIcon className="text-primary mt-0.5 mr-3 h-5 w-5" /> */}
                  {/*   <div> */}
                  {/*     <span className="text-foreground block font-bold"> */}
                  {/*       Team Sharing */}
                  {/*     </span> */}
                  {/*     <span className="text-muted-foreground text-sm"> */}
                  {/*       Share credits across your team members */}
                  {/*     </span> */}
                  {/*   </div> */}
                  {/* </li> */}
                  <li className="flex items-start">
                    <CheckCircleIcon className="text-primary mt-0.5 mr-3 h-5 w-5" />
                    <div>
                      <span className="text-foreground block font-bold">
                        Priority Support
                      </span>
                      <span className="text-muted-foreground text-sm">
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
