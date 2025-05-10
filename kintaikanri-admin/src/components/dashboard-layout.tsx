"use client"

import type React from "react"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto p-4 pb-6">{children}</main>
        </div>
      </SidebarProvider>
    </div>
  )
}
