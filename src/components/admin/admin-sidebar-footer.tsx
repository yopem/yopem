"use client"

import { ChevronUpIcon, LogOutIcon, UserIcon } from "lucide-react"
import Image from "next/image"

import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import { logout } from "@/lib/auth/logout"

interface User {
  name: string
  email: string
  avatar?: string
}

interface AdminSidebarFooterProps {
  user: User
}

const AdminSidebarFooter = ({ user }: AdminSidebarFooterProps) => {
  const handleLogout = async () => {
    await logout()
  }

  return (
    <Menu>
      <MenuTrigger
        className="hover:bg-sidebar-accent focus-visible:ring-sidebar-ring w-full rounded-md transition-colors outline-none focus-visible:ring-2"
        render={
          <button
            id="admin-sidebar-user-menu"
            className="flex items-center gap-3 p-2"
          >
            <div className="border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground flex size-8 items-center justify-center rounded-full border text-xs font-bold">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  className="size-8 rounded-full object-cover"
                  width={32}
                  height={32}
                />
              ) : (
                user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              )}
            </div>
            <div className="flex flex-1 flex-col items-start">
              <p className="text-sidebar-foreground text-sm font-medium">
                {user.name}
              </p>
              <p className="text-muted-foreground text-xs">{user.email}</p>
            </div>
            <ChevronUpIcon className="text-muted-foreground size-4" />
          </button>
        }
      />
      <MenuPopup side="top" align="end" sideOffset={8} className="min-w-56">
        <MenuItem>
          <UserIcon className="mr-2 size-4" />
          <span>Profile</span>
        </MenuItem>
        <MenuSeparator />
        <MenuItem onClick={handleLogout} variant="destructive">
          <LogOutIcon className="mr-2 size-4" />
          <span>Logout</span>
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}

export default AdminSidebarFooter
