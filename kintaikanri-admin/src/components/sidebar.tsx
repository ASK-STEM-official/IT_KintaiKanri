"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { auth } from "@/lib/firebase/config"
import { onAuthStateChanged } from "firebase/auth"
import { LayoutDashboard, Users, Building2 } from "lucide-react"

interface Team {
  id: string
  name: string
  leaderUid: string
}

interface UserRole {
  isAdmin: boolean
  teamIds: string[]
}

export function Sidebar() {
  const pathname = usePathname()
  const [teams, setTeams] = useState<Team[]>([])
  const [userRole, setUserRole] = useState<UserRole>({ isAdmin: false, teamIds: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserRole({ isAdmin: false, teamIds: [] })
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
          ...doc.data()
        })) as Team[]

        // ユーザーが所属する班のIDを取得
        const userTeamsQuery = query(
          collection(db, "users"),
          where("teamId", "in", teamsList.map(team => team.id))
        )
        const userTeamsSnapshot = await getDocs(userTeamsQuery)
        const userTeamIds = userTeamsSnapshot.docs
          .filter(doc => doc.id === user.uid)
          .map(doc => doc.data().teamId)

        // リーダー権限を持つ班のIDを取得
        const leaderTeamIds = teamsList
          .filter(team => team.leaderUid === user.uid)
          .map(team => team.id)

        setTeams(teamsList)
        setUserRole({
          isAdmin,
          teamIds: [...new Set([...userTeamIds, ...leaderTeamIds])]
        })
      } catch (error) {
        console.error("権限情報の取得に失敗しました:", error)
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  if (isLoading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex-1 overflow-auto py-2">
        <ScrollArea className="h-full px-2">
          <div className="space-y-1">
            {/* 個人ダッシュボード（全員表示） */}
            <Button
              asChild
              variant={pathname === "/dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                個人ダッシュボード
              </Link>
            </Button>

            {/* 班のメニュー（権限がある場合のみ表示） */}
            {teams.map((team) => {
              const hasAccess = userRole.isAdmin || userRole.teamIds.includes(team.id)
              if (!hasAccess) return null

              return (
                <div key={team.id} className="space-y-1">
                  <Button
                    asChild
                    variant={pathname === `/teams/${team.id}` ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Link href={`/teams/${team.id}`}>
                      <Building2 className="mr-2 h-4 w-4" />
                      {team.name}のダッシュボード
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant={pathname === `/teams/${team.id}/members` ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Link href={`/teams/${team.id}/members`}>
                      <Users className="mr-2 h-4 w-4" />
                      {team.name}の班員一覧
                    </Link>
                  </Button>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
} 