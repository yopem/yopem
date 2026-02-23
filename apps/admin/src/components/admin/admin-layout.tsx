"use client"

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@repo/ui/sidebar"
import { type ReactNode } from "react"

import AdminSidebar from "./admin-sidebar"

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

interface AdminLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
  navItems: NavItem[]
  user: User
}

const AdminLayout = ({
  children,
  title,
  subtitle,
  navItems,
  user,
}: AdminLayoutProps) => {
  return (
    <SidebarProvider>
      <AdminSidebar
        title={title}
        subtitle={subtitle}
        navItems={navItems}
        user={user}
      />
      <SidebarInset className="flex flex-col">
        <header className="flex items-center gap-2 p-4">
          <SidebarTrigger />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AdminLayout
