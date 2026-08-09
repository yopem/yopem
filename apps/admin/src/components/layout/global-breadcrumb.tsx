import { Link } from "@tanstack/react-router"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface GlobalBreadcrumbProps {
  items: BreadcrumbItem[]
}

export function GlobalBreadcrumb({ items }: GlobalBreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 pt-2 text-sm">
      {items.map((item, index) => (
        <div key={item.label} className="flex items-center gap-2">
          {item.href ? (
            <Link
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
          {index < items.length - 1 && <span className="text-border">/</span>}
        </div>
      ))}
    </div>
  )
}
