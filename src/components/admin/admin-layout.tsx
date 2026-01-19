"use client"

import { type ReactNode } from "react"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import AdminSidebar from "./admin-sidebar"

interface NavItem {
  icon: ReactNode
  label: string
  href: string
  active?: boolean
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
