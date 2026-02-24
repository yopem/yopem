import Link from "@repo/ui/link"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[]
}

const AdminBreadcrumb = ({ items }: AdminBreadcrumbProps) => {
  return (
    <div className="flex items-center gap-2 pt-2 text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          {item.href ? (
            <Link
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
          {items.indexOf(item) < items.length - 1 && (
            <span className="text-border">/</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default AdminBreadcrumb
