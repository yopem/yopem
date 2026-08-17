"use client"

import { ChevronUpIcon, HomeIcon, LogOutIcon, UserIcon } from "lucide-react"
import { useState } from "react"

import { siteUrl } from "env"
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar"
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "ui/menu"

import { logoutFn } from "@/lib/auth"

interface User {
  name: string
  email: string
  avatar?: string
}

interface GlobalSidebarFooterProps {
  user: User
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return parts
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function UserAvatar({ user, size }: { user: User; size: string }) {
  const initials = getInitials(user.name)
  return (
    <Avatar className={`${size} shrink-0`}>
      {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
      <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

export function GlobalSidebarFooter({ user }: GlobalSidebarFooterProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    try {
      const result = await logoutFn()
      if (result?.redirectTo) {
        window.location.href = result.redirectTo
      }
    } catch (error) {
      setIsLoggingOut(false)
      throw error
    }
  }

  return (
    <Menu>
      <MenuTrigger
        render={
          <button
            type="button"
            className="ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground flex w-full items-center gap-3 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden transition-colors focus-visible:ring-2"
          >
            <UserAvatar user={user} size="size-8" />
            <div className="flex min-w-0 flex-1 flex-col items-start group-data-[collapsible=icon]:hidden">
              <span className="text-sidebar-foreground truncate text-sm font-medium">
                {user.name}
              </span>
              <span className="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
            </div>
            <ChevronUpIcon className="text-muted-foreground ms-2 size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
          </button>
        }
      />
      <MenuPopup
        side="top"
        align="start"
        sideOffset={4}
        positionMethod="fixed"
        className="min-w-56"
      >
        <MenuGroup>
          <div className="flex items-center gap-3 px-2 py-1.5">
            <UserAvatar user={user} size="size-8" />
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {user.email}
              </p>
            </div>
          </div>
        </MenuGroup>
        <MenuSeparator />
        <MenuLinkItem
          render={
            <a href={siteUrl}>
              <HomeIcon className="mr-2 size-4" />
              <span>Back to Home</span>
            </a>
          }
        />
        <MenuLinkItem
          render={
            <a href={`${siteUrl}/profile`}>
              <UserIcon className="mr-2 size-4" />
              <span>Profile</span>
            </a>
          }
        />
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
