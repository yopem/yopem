import { Badge } from "@repo/ui/badge"
import {
  CheckCircleIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  NetworkIcon,
  RocketIcon,
  ZapIcon,
} from "lucide-react"

import FeatureCard from "./feature-card"

const Features = () => {
  return (
    <section className="bg-background w-full py-24">
      <div className="container mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="mb-16 flex max-w-[800px] flex-col items-start gap-4">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Why Choose Yopem?
          </h2>
          <p className="text-muted-foreground text-lg/relaxed">
            Simplify your workflow. Access powerful AI tools without the
            complexity of managing multiple platforms and subscriptions.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<CreditCardIcon className="size-5" />}
            title="Pay As You Go"
            description="Buy credits once and use them anytime. No recurring charges, no subscriptions—just simple, flexible pricing that scales with your needs."
          />
          <FeatureCard
            icon={<ZapIcon className="size-5" />}
            title="Instant Access"
            description="No setup required. Start using AI tools immediately. Everything you need in one place."
          />
          <FeatureCard
            icon={<LayoutDashboardIcon className="size-5" />}
            title="Unified Dashboard"
            description="Manage all your AI operations from one clean interface. Monitor usage, track costs, and access powerful tools without the hassle."
          />
        </div>
        <div className="mt-6 grid h-auto grid-cols-1 gap-6 md:grid-cols-2 lg:h-[420px] lg:grid-cols-3">
          <div className="bg-card border-border/50 relative flex flex-col overflow-hidden rounded-2xl border md:col-span-2 md:flex-row">
            <Badge
              variant="secondary"
              className="bg-muted/80 text-muted-foreground border-border/50 absolute top-6 right-6 z-20 font-medium tracking-wide uppercase"
            >
              Coming Soon
            </Badge>
            <div className="relative z-10 flex max-w-[480px] flex-col justify-center p-10">
              <h3 className="text-foreground mb-4 text-2xl font-semibold tracking-tight">
                Multi-Model Support
              </h3>
              <p className="text-muted-foreground mb-8 text-sm/relaxed">
                Access multiple AI models through a single platform. Use the
                best model for each task without switching between services.
              </p>
              <ul className="space-y-3">
                <li className="text-foreground/80 flex items-center text-sm font-medium">
                  <CheckCircleIcon className="text-muted-foreground mr-3 size-4" />
                  Access leading AI models
                </li>
                <li className="text-foreground/80 flex items-center text-sm font-medium">
                  <CheckCircleIcon className="text-muted-foreground mr-3 size-4" />
                  Easy-to-use interface
                </li>
                <li className="text-foreground/80 flex items-center text-sm font-medium">
                  <CheckCircleIcon className="text-muted-foreground mr-3 size-4" />
                  Transparent pricing
                </li>
              </ul>
            </div>
            <div className="bg-muted/30 border-border/50 relative min-h-[240px] flex-1 overflow-hidden border-l md:min-h-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-border/50 relative flex size-[220px] items-center justify-center rounded-full border">
                  <div className="bg-card border-border/50 absolute -top-4 rounded-md border px-2.5 py-1 font-mono text-[10px] font-medium shadow-sm">
                    GPT-4
                  </div>
                  <div className="bg-card border-border/50 absolute -bottom-4 rounded-md border px-2.5 py-1 font-mono text-[10px] font-medium shadow-sm">
                    Claude 3
                  </div>
                  <div className="bg-card border-border/50 absolute -left-6 rounded-md border px-2.5 py-1 font-mono text-[10px] font-medium shadow-sm">
                    Mistral
                  </div>
                  <div className="bg-muted text-foreground border-border/50 z-10 flex size-14 items-center justify-center rounded-full border font-bold shadow-sm">
                    <NetworkIcon className="size-5" />
                  </div>
                  <div className="border-muted-foreground/15 absolute inset-0 animate-[spin_12s_linear_infinite] rounded-full border border-dashed" />
                </div>
              </div>
            </div>
          </div>
          <div className="group border-border/50 bg-card relative flex flex-col justify-between overflow-hidden rounded-2xl border p-10 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <Badge
              variant="secondary"
              className="bg-muted/80 text-muted-foreground border-border/50 absolute top-6 right-6 z-20 font-medium tracking-wide uppercase"
            >
              Coming Soon
            </Badge>
            <div className="bg-muted/30 pointer-events-none absolute -top-20 -right-20 size-64 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="bg-muted border-border/50 mb-6 flex size-12 items-center justify-center rounded-xl border">
                <RocketIcon className="text-foreground size-5" />
              </div>
              <h3 className="text-foreground mb-3 text-2xl font-semibold tracking-tight">
                Developer API
              </h3>
              <p className="text-muted-foreground text-sm/relaxed">
                Integrate our platform into your applications. Simple API with
                powerful capabilities.
              </p>
            </div>
            <div className="border-border/50 bg-muted/30 relative z-10 mt-10 rounded-xl border p-5 font-mono text-xs/relaxed">
              <div className="mb-2 flex gap-2">
                <span className="text-muted-foreground">const</span>{" "}
                <span className="text-foreground">yopem</span> ={" "}
                <span className="text-muted-foreground">new</span>{" "}
                <span className="text-foreground">Yopem</span>
                <span className="text-muted-foreground">();</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">await</span>{" "}
                <span className="text-foreground">yopem</span>
                <span className="text-muted-foreground">.</span>
                <span className="text-foreground font-medium">generate</span>
                <span className="text-muted-foreground">({"{"}</span>
              </div>
              <div className="pl-4">
                <span className="text-foreground">model:</span>{" "}
                <span className="text-muted-foreground">&apos;best&apos;</span>
                <span className="text-muted-foreground">,</span>
              </div>
              <div className="pl-4">
                <span className="text-foreground">prompt:</span>{" "}
                <span className="text-muted-foreground">
                  &apos;Hello world&apos;
                </span>
              </div>
              <div className="text-muted-foreground">{"});"}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features
