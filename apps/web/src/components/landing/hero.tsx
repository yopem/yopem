import { Button } from "@repo/ui/button"
import { BarChart3Icon, BotIcon, ImageIcon, PlayCircleIcon } from "lucide-react"

import GetStartedButton from "@/components/navigation/get-started-button"

const Hero = () => {
  return (
    <section className="relative flex min-h-[80vh] w-full flex-col items-center justify-center overflow-hidden pt-16 pb-24">
      <div className="pointer-events-none absolute inset-0 size-full bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] mask-[linear-gradient(to_bottom,transparent,10%,black,90%,transparent)] bg-size-[40px_40px] opacity-20" />
      <div className="relative z-10 container mx-auto flex max-w-[800px] flex-col items-center px-4 text-center md:px-6">
        <h1 className="text-foreground mb-6 pb-2 text-4xl/tight font-semibold tracking-tight md:text-6xl lg:text-7xl">
          Your AI Tools Hub
        </h1>
        <p className="text-muted-foreground mb-10 max-w-160 text-lg/relaxed md:text-xl">
          Access powerful AI tools with simple credit-based pricing.{" "}
          <br className="hidden sm:block" />
          No subscriptions, no complexity, just use the tools you need to work
          smarter.
        </p>
        <div className="flex w-full flex-wrap items-center justify-center gap-4">
          <GetStartedButton className="h-11 rounded-full px-8 text-sm font-medium shadow-sm" />
          <Button
            size="lg"
            variant="outline"
            className="bg-background/50 border-border/50 hover:bg-muted/50 h-11 rounded-full px-8 text-sm font-medium backdrop-blur-sm"
          >
            <PlayCircleIcon className="mr-2 size-4" />
            View Demo
          </Button>
        </div>
        <div className="group bg-card/60 border-border/50 relative mt-20 aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="from-muted/30 absolute inset-0 bg-linear-to-tr via-transparent to-transparent" />
          <div className="bg-card/40 border-border/50 flex h-12 items-center gap-2 border-b px-4">
            <div className="bg-muted-foreground/20 size-2.5 rounded-full" />
            <div className="bg-muted-foreground/20 size-2.5 rounded-full" />
            <div className="bg-muted-foreground/20 size-2.5 rounded-full" />
          </div>
          <div className="grid h-full grid-cols-12 gap-6 p-8">
            <div className="border-border/50 col-span-3 hidden space-y-3 border-r pr-4 sm:block">
              <div className="bg-muted/60 h-8 w-full animate-pulse rounded-md" />
              <div className="bg-muted/40 h-8 w-3/4 animate-pulse rounded-md" />
              <div className="bg-muted/40 h-8 w-5/6 animate-pulse rounded-md" />
            </div>
            <div className="col-span-12 space-y-4 sm:col-span-9">
              <div className="mb-6 flex items-center justify-between">
                <div className="bg-muted/60 h-10 w-1/3 rounded-md" />
                <div className="bg-primary/10 h-10 w-24 rounded-md" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/20 border-border/50 hover:bg-muted/40 flex h-32 items-center justify-center rounded-xl border transition-colors">
                  <BotIcon className="text-muted-foreground/50 size-10" />
                </div>
                <div className="bg-muted/20 border-border/50 hover:bg-muted/40 flex h-32 items-center justify-center rounded-xl border transition-colors">
                  <ImageIcon className="text-muted-foreground/50 size-10" />
                </div>
                <div className="bg-muted/20 border-border/50 hover:bg-muted/40 flex h-32 items-center justify-center rounded-xl border transition-colors">
                  <BarChart3Icon className="text-muted-foreground/50 size-10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
