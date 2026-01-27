"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronUpIcon, LogOutIcon, UserIcon } from "lucide-react"

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

interface UserSidebarFooterProps {
  user: User
}

const UserSidebarFooter = ({ user }: UserSidebarFooterProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      setIsLoggingOut(false)
      throw error
    }
  }

  return (
    <Menu>
      <MenuTrigger
        className="hover:bg-sidebar-accent focus-visible:ring-sidebar-ring w-full rounded-md transition-colors outline-none focus-visible:ring-2"
        render={
          <div className="flex items-center gap-3 p-2">
            <div className="border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
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
            <ChevronUpIcon className="text-muted-foreground h-4 w-4" />
          </div>
        }
      />
      <MenuPopup side="top" align="end" sideOffset={8} className="min-w-56">
        <MenuItem>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          onClick={handleLogout}
          variant="destructive"
          disabled={isLoggingOut}
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}

export default UserSidebarFooter
