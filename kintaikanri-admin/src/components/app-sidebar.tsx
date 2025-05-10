"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { CalendarClock, Users, Home, LogOut, ChevronDown } from "lucide-react"
import { useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

// メニュー項目の定義
const menuItems = [
  {
    title: "個人ダッシュボード",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "開発班",
    icon: Users,
    subItems: [
      {
        title: "ダッシュボード",
        href: "/dashboard/team",
      },
      {
        title: "班員一覧",
        href: "/dashboard/team/members",
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [openSubMenu, setOpenSubMenu] = useState<string | null>("開発班") // デフォルトで開く

  const toggleSubMenu = (title: string) => {
    setOpenSubMenu(openSubMenu === title ? null : title)
  }

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="py-4 px-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-6 w-6" />
          <h1 className="text-lg font-bold">勤怠管理システム</h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.subItems ? (
                <>
                  <SidebarMenuButton
                    onClick={() => toggleSubMenu(item.title)}
                    isActive={pathname.startsWith(`/dashboard/team`)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                    <ChevronDown
                      className={`ml-auto h-4 w-4 transition-transform ${
                        openSubMenu === item.title ? "rotate-180" : ""
                      }`}
                    />
                  </SidebarMenuButton>
                  {openSubMenu === item.title && (
                    <SidebarMenuSub>
                      {item.subItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.href}>
                          <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                            <Link href={subItem.href}>{subItem.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </>
              ) : (
                <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button className="w-full">
                <LogOut className="h-5 w-5" />
                <span>ログアウト</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
