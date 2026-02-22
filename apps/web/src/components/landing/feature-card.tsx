import type { ReactNode } from "react"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="group bg-card hover:border-border/80 border-border/50 relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="bg-muted text-foreground mb-6 inline-flex size-12 items-center justify-center rounded-xl">
        {icon}
      </div>
      <h3 className="text-foreground mb-3 text-xl font-semibold tracking-tight">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm/relaxed">{description}</p>
    </div>
  )
}

export default FeatureCard
