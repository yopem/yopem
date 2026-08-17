"use client"

import { type ReactNode } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "ui/sidebar"
import { ThemeSwitcher } from "ui/theme-switcher"

import { GlobalSidebarFooter } from "./global-sidebar-footer"
import { GlobalSidebarHeader } from "./global-sidebar-header"
import { GlobalSidebarNav } from "./global-sidebar-nav"

interface NavSubItem {
  label: string
  href: string
}

interface NavItem {
  icon: ReactNode
  label: string
  href: string
  subItems?: NavSubItem[]
}

interface User {
  name: string
  email: string
  avatar?: string
}

interface GlobalSidebarProps {
  title: string
  subtitle: string
  navItems: NavItem[]
  user: User
}

export function GlobalSidebar({
  title,
  subtitle,
  navItems,
  user,
}: GlobalSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <GlobalSidebarHeader title={title} subtitle={subtitle} />
      </SidebarHeader>
      <SidebarContent className="px-6">
        <GlobalSidebarNav items={navItems} />
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border border-t p-4">
        <div className="flex items-center justify-center">
          <ThemeSwitcher />
        </div>
        <GlobalSidebarFooter user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
