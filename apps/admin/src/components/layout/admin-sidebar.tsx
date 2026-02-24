"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@repo/ui/sidebar"
import ThemeSwitcher from "@repo/ui/theme-switcher"
import UserSidebarFooter from "@/components/user/user-sidebar-footer"
import { type ReactNode } from "react"

import AdminSidebarHeader from "./admin-sidebar-header"
import AdminSidebarNav from "./admin-sidebar-nav"

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
  image?: string
}

interface AdminSidebarProps {
  title: string
  subtitle: string
  navItems: NavItem[]
  user: User
}

const AdminSidebar = ({
  title,
  subtitle,
  navItems,
  user,
}: AdminSidebarProps) => {
  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <AdminSidebarHeader title={title} subtitle={subtitle} />
      </SidebarHeader>
      <SidebarContent className="px-6">
        <AdminSidebarNav items={navItems} />
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

export default AdminSidebar
