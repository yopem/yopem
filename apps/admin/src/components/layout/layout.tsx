"use client"

import { type ReactNode } from "react"

import { SidebarInset, SidebarProvider, SidebarTrigger } from "ui/sidebar"

import GlobalSidebar from "./global-sidebar"

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

export interface User {
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

const Layout = ({
  children,
  title,
  subtitle,
  navItems,
  user,
}: AdminLayoutProps) => {
  return (
    <SidebarProvider>
      <GlobalSidebar
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

export default Layout
