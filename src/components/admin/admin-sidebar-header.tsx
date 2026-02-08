import Logo from "@/components/logo"

interface AdminSidebarHeaderProps {
  title: string
  subtitle: string
}

const AdminSidebarHeader = ({ title, subtitle }: AdminSidebarHeaderProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-white text-black">
        <Logo className="size-5" />
      </div>
      <div className="flex flex-col">
        <h1 className="text-sidebar-foreground text-lg leading-none font-bold tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground mt-1 text-[10px] font-medium tracking-wider uppercase">
          {subtitle}
        </p>
      </div>
    </div>
  )
}

export default AdminSidebarHeader
