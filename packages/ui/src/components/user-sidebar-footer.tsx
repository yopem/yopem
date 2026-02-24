"use client"

import type { ReactNode } from "react"

import { logout } from "@repo/auth/logout"
import { ChevronUpIcon, LogOutIcon } from "lucide-react"
import Image from "next/image"
import { unstable_rethrow } from "next/navigation"
import { useState } from "react"

import Link from "./link"
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from "./menu"

interface User {
  name: string
  email: string
  avatar?: string
}

interface UserSidebarMenuItem {
  href: string
  icon: ReactNode
  label: string
}

interface UserSidebarFooterProps {
  user: User
  menuItems?: UserSidebarMenuItem[]
}

const UserSidebarFooter = ({ user, menuItems }: UserSidebarFooterProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      unstable_rethrow(error)
      setIsLoggingOut(false)
      throw error
    }
  }

  return (
    <Menu>
      <MenuTrigger
        className="hover:bg-sidebar-accent focus-visible:ring-sidebar-ring w-full rounded-md transition-colors outline-none focus-visible:ring-2"
        render={
          <button
            className="flex items-center gap-3 p-2"
            id="user-sidebar-footer-trigger"
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
        {menuItems &&
          menuItems.map((item) => (
            <MenuItem key={item.href}>
              <Link href={item.href} className="flex items-center">
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Link>
            </MenuItem>
          ))}
        <MenuSeparator />
        <MenuItem
          onClick={handleLogout}
          variant="destructive"
          disabled={isLoggingOut}
        >
          <LogOutIcon className="mr-2 size-4" />
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}

export default UserSidebarFooter
