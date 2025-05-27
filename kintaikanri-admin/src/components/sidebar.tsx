"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { CalendarClock, Users, Home, LogOut, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/config"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { auth } from "@/lib/firebase/config"
import { onAuthStateChanged } from "firebase/auth"

import {
  Sidebar as SidebarComponent,
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
]

export function Sidebar() {
  const pathname = usePathname()
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null)
  const [teams, setTeams] = useState<{ id: string, name: string, leaderUid: string }[]>([])
  const [userRole, setUserRole] = useState<{ isAdmin: boolean, leaderTeamIds: string[] }>({ isAdmin: false, leaderTeamIds: [] })
  const [isLoading, setIsLoading] = useState(true)

  // ユーザー権限と班一覧を取得
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserRole({ isAdmin: false, leaderTeamIds: [] })
        setIsLoading(false)
        return
      }

      try {
        // 管理者権限の確認
        const userDoc = await getDoc(doc(db, "users", user.uid))
        const isAdmin = userDoc.exists() && userDoc.data().role === "admin"

        // 班情報の取得
        const teamsRef = collection(db, "teams")
        const teamsSnapshot = await getDocs(teamsRef)
        const teamsList = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          leaderUid: doc.data().leaderUid
        }))

        // リーダー権限を持つ班のIDを取得
        const leaderTeamIds = teamsList
          .filter(team => team.leaderUid === user.uid)
          .map(team => team.id)

        setTeams(teamsList)
        setUserRole({
          isAdmin,
          leaderTeamIds
        })
      } catch (error) {
        console.error("権限情報の取得に失敗しました:", error)
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const toggleSubMenu = (title: string) => {
    setOpenSubMenu(openSubMenu === title ? null : title)
  }

  if (isLoading) {
    return <div>読み込み中...</div>
  }

  return (
    <SidebarComponent className="border-r">
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
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {/* 班一覧のドロップダウン（管理者または班リーダーの場合のみ表示） */}
          {teams.map((team) => {
            const hasAccess = userRole.isAdmin || userRole.leaderTeamIds.includes(team.id)
            if (!hasAccess) return null

            return (
              <SidebarMenuItem key={team.id}>
                <SidebarMenuButton
                  onClick={() => toggleSubMenu(team.id)}
                  isActive={pathname.startsWith(`/dashboard/team/${team.id}`)}
                >
                  <Users className="h-5 w-5" />
                  <span>{team.name}</span>
                  <ChevronDown
                    className={`ml-auto h-4 w-4 transition-transform ${
                      openSubMenu === team.id ? "rotate-180" : ""
                    }`}
                  />
                </SidebarMenuButton>
                {openSubMenu === team.id && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === `/dashboard/team/${team.id}`}
                      >
                        <Link href={`/dashboard/team/${team.id}`}>ダッシュボード</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === `/dashboard/team/${team.id}/members`}
                      >
                        <Link href={`/dashboard/team/${team.id}/members`}>班員一覧</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            )
          })}
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
    </SidebarComponent>
  )
} 