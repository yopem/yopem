import GetStartedButton from "@/components/navigation/get-started-button"

const CTA = () => {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-700" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-white)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-white)_1px,transparent_1px)] bg-size-[40px_40px] opacity-10" />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-zinc-900 via-transparent to-transparent" />
      <div className="relative z-10 container mx-auto px-4 text-center md:px-6">
        <h2 className="mb-6 text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
          Ready to unify your AI stack?
        </h2>
        <p className="mx-auto mb-10 max-w-[600px] text-lg text-white">
          Start building with unified access to all major AI tools.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <GetStartedButton className="h-12 w-full bg-white px-8 font-bold text-zinc-950 hover:bg-white/80 hover:text-zinc-900 sm:w-auto" />
        </div>
      </div>
    </section>
  )
}

export default CTA
