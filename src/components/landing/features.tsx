import {
  CheckCircleIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  NetworkIcon,
  RocketIcon,
  ZapIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import FeatureCard from "./feature-card"

const Features = () => {
  return (
    <section className="bg-background w-full py-20">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 flex max-w-[720px] flex-col items-start gap-4">
          <h2 className="text-foreground text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Why Choose Yopem?
          </h2>
          <p className="text-muted-foreground text-lg">
            Simplify your workflow. Access powerful AI tools without the
            complexity of managing multiple platforms and subscriptions.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<CreditCardIcon className="h-6 w-6" />}
            title="Pay As You Go"
            description="Buy credits once and use them anytime. No recurring charges, no subscriptions—just simple, flexible pricing that scales with your needs."
          />
          <FeatureCard
            icon={<ZapIcon className="h-6 w-6" />}
            title="Instant Access"
            description="No setup required. Start using AI tools immediately. Everything you need in one place."
          />
          <FeatureCard
            icon={<LayoutDashboardIcon className="h-6 w-6" />}
            title="Unified Dashboard"
            description="Manage all your AI operations from one clean interface. Monitor usage, track costs, and access powerful tools without the hassle."
          />
        </div>
        <div className="mt-6 grid h-auto grid-cols-1 gap-6 md:grid-cols-2 lg:h-[400px] lg:grid-cols-3">
          <div className="bg-card relative flex flex-col overflow-hidden rounded-xl border md:col-span-2 md:flex-row">
            <Badge
              variant="warning"
              className="absolute top-4 right-4 z-20 tracking-wide uppercase"
            >
              Coming Soon
            </Badge>
            <div className="relative z-10 flex max-w-md flex-col justify-center p-8">
              <h3 className="text-foreground mb-3 text-2xl font-bold">
                Multi-Model Support
              </h3>
              <p className="text-muted-foreground mb-6">
                Access multiple AI models through a single platform. Use the
                best model for each task without switching between services.
              </p>
              <ul className="space-y-2">
                <li className="text-foreground/80 flex items-center text-sm">
                  <CheckCircleIcon className="text-primary mr-2 h-4 w-4" />
                  Access leading AI models
                </li>
                <li className="text-foreground/80 flex items-center text-sm">
                  <CheckCircleIcon className="text-primary mr-2 h-4 w-4" />
                  Easy-to-use interface
                </li>
                <li className="text-foreground/80 flex items-center text-sm">
                  <CheckCircleIcon className="text-primary mr-2 h-4 w-4" />
                  Transparent pricing
                </li>
              </ul>
            </div>
            <div className="bg-muted/50 relative min-h-[200px] flex-1 overflow-hidden md:min-h-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative flex h-48 w-48 items-center justify-center rounded-full border">
                  <div className="bg-card absolute -top-4 rounded border px-2 font-mono text-xs">
                    GPT-4
                  </div>
                  <div className="bg-card absolute -bottom-4 rounded border px-2 font-mono text-xs">
                    Claude 3
                  </div>
                  <div className="bg-card absolute -left-8 rounded border px-2 font-mono text-xs">
                    Mistral
                  </div>
                  <div className="bg-primary text-primary-foreground z-10 flex size-16 items-center justify-center rounded-full font-bold">
                    <NetworkIcon className="h-6 w-6" />
                  </div>
                  <div className="border-muted-foreground/20 absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border border-dashed" />
                </div>
              </div>
            </div>
          </div>
          <div className="group border-primary/20 from-primary/5 via-primary/10 to-primary/5 shadow-primary/5 relative flex flex-col justify-between overflow-hidden rounded-xl border bg-gradient-to-br p-8 shadow-lg">
            <Badge
              variant="warning"
              className="absolute top-4 right-4 z-20 tracking-wide uppercase"
            >
              Coming Soon
            </Badge>
            <div className="bg-primary/20 pointer-events-none absolute -top-16 -right-16 size-64 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="bg-primary/10 ring-primary/20 mb-6 flex size-12 items-center justify-center rounded-lg ring-1 backdrop-blur-sm">
                <RocketIcon className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-foreground mb-2 text-2xl font-bold">
                Developer API
              </h3>
              <p className="text-muted-foreground">
                Integrate our platform into your applications. Simple API with
                powerful capabilities.
              </p>
            </div>
            <div className="border-primary/20 bg-card/50 relative z-10 mt-8 rounded-lg border p-4 font-mono text-xs shadow-inner">
              <div className="mb-2 flex gap-2">
                <span className="text-muted-foreground">const</span>{" "}
                <span className="text-foreground">yopem</span> ={" "}
                <span className="text-primary">new</span>{" "}
                <span className="text-foreground">Yopem</span>
                <span className="text-muted-foreground">();</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary">await</span>{" "}
                <span className="text-foreground">yopem</span>
                <span className="text-muted-foreground">.</span>
                <span className="text-primary">generate</span>
                <span className="text-muted-foreground">({"{"}</span>
              </div>
              <div className="pl-4">
                <span className="text-foreground">model:</span>{" "}
                <span className="text-success">&apos;best&apos;</span>
                <span className="text-muted-foreground">,</span>
              </div>
              <div className="pl-4">
                <span className="text-foreground">prompt:</span>{" "}
                <span className="text-success">&apos;Hello world&apos;</span>
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
