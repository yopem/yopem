import type { ReactNode } from "react"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="group bg-card hover:border-muted-foreground/20 relative overflow-hidden rounded-xl border p-6 transition-all hover:shadow-lg">
      <div className="bg-primary text-primary-foreground mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
        {icon}
      </div>
      <h3 className="text-foreground mb-2 text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  )
}

export default FeatureCard
