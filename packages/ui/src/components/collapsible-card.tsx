"use client"

import { ChevronDownIcon } from "lucide-react"
import { useState, type ReactNode } from "react"

interface CollapsibleCardProps {
  title: string
  action?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

export function CollapsibleCard({
  title,
  action,
  defaultOpen = true,
  children,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-border flex flex-col gap-3 rounded-lg border">
      <div className="border-border flex items-center justify-between border-b p-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="hover:text-foreground flex items-center gap-1 text-sm font-semibold"
          aria-expanded={open}
        >
          <ChevronDownIcon
            className={`size-4 transition-transform ${
              open ? "" : "-rotate-90"
            }`}
          />
          {title}
        </button>
        {action}
      </div>
      {open && <div className="flex flex-col gap-3 px-3 pb-3">{children}</div>}
    </div>
  )
}
