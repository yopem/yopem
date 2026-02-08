"use client"

import { type ReactNode } from "react"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import UserSidebar from "./user-sidebar"

interface NavItem {
  icon: ReactNode
  label: string
  href: string
}

interface User {
  name: string
  email: string
  avatar?: string
}

interface UserLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
  navItems: NavItem[]
  user: User
}

const UserLayout = ({
  children,
  title,
  subtitle,
  navItems,
  user,
}: UserLayoutProps) => {
  return (
    <SidebarProvider>
      <UserSidebar
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

export default UserLayout
