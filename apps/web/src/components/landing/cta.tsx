import GetStartedButton from "@/components/navigation/get-started-button"

const CTA = () => {
  return (
    <section className="relative overflow-hidden py-32">
      <div className="bg-background absolute inset-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[40px_40px] opacity-20" />
      <div className="from-background pointer-events-none absolute inset-0 bg-linear-to-t via-transparent to-transparent" />
      <div className="relative z-10 container mx-auto px-4 text-center md:px-6">
        <div className="border-border/50 bg-card/50 mx-auto max-w-[800px] overflow-hidden rounded-3xl border p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl md:p-16">
          <h2 className="text-foreground mb-6 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Ready to unify your AI stack?
          </h2>
          <p className="text-muted-foreground mx-auto mb-10 max-w-[600px] text-lg/relaxed">
            Start building with unified access to all major AI tools.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <GetStartedButton className="bg-foreground text-background hover:bg-foreground/90 h-12 w-full rounded-full px-8 font-medium shadow-sm sm:w-auto" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA
