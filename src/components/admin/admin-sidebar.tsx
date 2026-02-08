"use client"

import { type ReactNode } from "react"

import ThemeSwitcher from "@/components/theme/theme-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

import AdminSidebarFooter from "./admin-sidebar-footer"
import AdminSidebarHeader from "./admin-sidebar-header"
import AdminSidebarNav from "./admin-sidebar-nav"

interface NavItem {
  icon: ReactNode
  label: string
  href: string
  active?: boolean
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
        <AdminSidebarFooter user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AdminSidebar
