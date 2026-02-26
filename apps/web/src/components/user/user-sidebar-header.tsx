import Logo from "@repo/ui/logo"
import { Link } from "@tanstack/react-router"

interface UserSidebarHeaderProps {
  title: string
  subtitle: string
}

const UserSidebarHeader = ({ title, subtitle }: UserSidebarHeaderProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-white text-black">
        <Link to="/">
          <Logo className="size-5" />
        </Link>
      </div>
      <div className="flex flex-col">
        <Link to="/">
          <h1 className="text-sidebar-foreground text-lg leading-none font-bold tracking-tight">
            {title}
          </h1>
        </Link>
        <p className="text-muted-foreground mt-1 text-[10px] font-medium tracking-wider uppercase">
          {subtitle}
        </p>
      </div>
    </div>
  )
}

export default UserSidebarHeader
