"use client"

import { type ReactNode } from "react"

import ThemeSwitcher from "@/components/theme/theme-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import UserSidebarFooter from "./user-sidebar-footer"
import UserSidebarHeader from "./user-sidebar-header"
import UserSidebarNav from "./user-sidebar-nav"

interface NavItem {
  icon: ReactNode
  label: string
  href: string
}

interface User {
  name: string
  email: string
  image?: string
}

interface UserSidebarProps {
  title: string
  subtitle: string
  navItems: NavItem[]
  user: User
}

const UserSidebar = ({ title, subtitle, navItems, user }: UserSidebarProps) => {
  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <UserSidebarHeader title={title} subtitle={subtitle} />
      </SidebarHeader>
      <SidebarContent className="px-6">
        <UserSidebarNav items={navItems} />
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border space-y-3 border-t p-4">
        <div className="flex items-center justify-center">
          <ThemeSwitcher />
        </div>
        <UserSidebarFooter user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default UserSidebar
