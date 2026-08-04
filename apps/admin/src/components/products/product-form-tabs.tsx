"use client"

import {
  CheckIcon,
  GitBranchIcon,
  PencilIcon,
  SlidersHorizontalIcon,
} from "lucide-react"

export type ProductFormStep = "basics" | "workflow" | "configure"

interface ProductFormTabsProps {
  activeStep: ProductFormStep
  onStepChange: (step: ProductFormStep) => void
}

const steps: {
  id: ProductFormStep
  label: string
  description: string
  icon: React.ElementType
}[] = [
  {
    id: "basics",
    label: "Basics",
    description: "Name & description",
    icon: PencilIcon,
  },
  {
    id: "workflow",
    label: "Workflow",
    description: "Steps & AI nodes",
    icon: GitBranchIcon,
  },
  {
    id: "configure",
    label: "Configure",
    description: "Model & pricing",
    icon: SlidersHorizontalIcon,
  },
]

export function ProductFormTabs({
  activeStep,
  onStepChange,
}: ProductFormTabsProps) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep)
  const progress =
    steps.length <= 1 ? 100 : (activeIndex / (steps.length - 1)) * 100

  return (
    <nav
      aria-label="Product builder steps"
      className="relative w-full px-8 py-5"
    >
      {/* connector line */}
      <div className="bg-muted absolute inset-x-12 top-9 h-0.5 rounded-full">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${progress}%, hsl(var(--muted)) ${progress}%, hsl(var(--muted)) 100%)`,
          }}
        />
      </div>

      <ol className="relative flex w-full justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = index === activeIndex
          const isCompleted = index < activeIndex

          return (
            <li
              key={step.id}
              className="flex flex-1 justify-center first:justify-start last:justify-end"
            >
              <button
                type="button"
                onClick={() => onStepChange(step.id)}
                aria-current={isActive ? "step" : undefined}
                className="group focus-visible:ring-ring flex flex-col items-center gap-2 rounded-md px-2 py-1 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                    isCompleted || isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted bg-background text-muted-foreground"
                  } ${isActive ? "ring-primary/20 ring-offset-background ring-2 ring-offset-2" : ""}`}
                >
                  {isCompleted ? (
                    <CheckIcon className="size-4" />
                  ) : isActive ? (
                    <Icon className="size-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <div className="flex flex-col items-center">
                  <span
                    className={`text-sm font-semibold ${
                      isActive || isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {step.description}
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
