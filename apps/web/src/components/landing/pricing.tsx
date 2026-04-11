import { Link } from "@tanstack/react-router"
import { CheckCircleIcon } from "lucide-react"

import { Button } from "ui/button"

const Pricing = () => {
  return (
    <section className="bg-background border-border/50 w-full border-t py-24">
      <div className="container mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="mb-16 text-center">
          <h2 className="text-foreground mb-4 text-3xl font-semibold tracking-tight md:text-5xl">
            Simple Subscription Plans
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg/relaxed">
            Choose the plan that fits your needs. Start free and upgrade as you
            grow.
          </p>
        </div>
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Free Tier */}
            <div className="border-border/50 bg-card rounded-2xl border p-8">
              <div className="mb-4">
                <h3 className="text-foreground text-xl font-semibold">Free</h3>
                <p className="text-muted-foreground text-sm">
                  For trying out the platform
                </p>
              </div>
              <div className="mb-6">
                <span className="text-foreground text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="text-primary mt-0.5 size-5" />
                  <span className="text-muted-foreground text-sm">
                    50 tool executions/month
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="text-primary mt-0.5 size-5" />
                  <span className="text-muted-foreground text-sm">
                    1,000 tokens per request
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="text-primary mt-0.5 size-5" />
                  <span className="text-muted-foreground text-sm">
                    Access to public tools
                  </span>
                </li>
              </ul>
            </div>

            {/* Pro Tier */}
            <div className="border-primary/50 bg-card relative rounded-2xl border-2 p-8">
              <div className="bg-primary text-primary-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium">
                Most Popular
              </div>
              <div className="mb-4">
                <h3 className="text-foreground text-xl font-semibold">Pro</h3>
                <p className="text-muted-foreground text-sm">
                  For individual power users
                </p>
              </div>
              <div className="mb-6">
                <span className="text-foreground text-4xl font-bold">$19</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="text-primary mt-0.5 size-5" />
                  <span className="text-muted-foreground text-sm">
                    1,000 tool executions/month
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="text-primary mt-0.5 size-5" />
                  <span className="text-muted-foreground text-sm">
                    5,000 tokens per request
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="text-primary mt-0.5 size-5" />
                  <span className="text-muted-foreground text-sm">
                    Up to 10 custom tools
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="text-primary mt-0.5 size-5" />
                  <span className="text-muted-foreground text-sm">
                    Priority support
                  </span>
                </li>
              </ul>
              <Button
                className="mt-6 w-full"
                render={<Link to="/dashboard/subscription" />}
              >
                Upgrade to Pro
              </Button>
            </div>

            {/* Enterprise Tier */}
            <div className="border-border/50 bg-card rounded-2xl border p-8">
              <div className="mb-4">
                <h3 className="text-foreground text-xl font-semibold">
                  Enterprise
                </h3>
                <p className="text-muted-foreground text-sm">
                  For teams and businesses
                </p>
              </div>
              <div className="mb-6">
                <span className="text-foreground text-4xl font-bold">$99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="text-primary mt-0.5 size-5" />
                  <span className="text-muted-foreground text-sm">
                    Unlimited tool executions
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="text-primary mt-0.5 size-5" />
                  <span className="text-muted-foreground text-sm">
                    10,000 tokens per request
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="text-primary mt-0.5 size-5" />
                  <span className="text-muted-foreground text-sm">
                    Unlimited custom tools
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="text-primary mt-0.5 size-5" />
                  <span className="text-muted-foreground text-sm">
                    Team collaboration
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="text-primary mt-0.5 size-5" />
                  <span className="text-muted-foreground text-sm">
                    Dedicated support
                  </span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="mt-6 w-full"
                render={<Link to="/dashboard/subscription" />}
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Pricing
