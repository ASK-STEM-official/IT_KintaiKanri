"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase/config"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "admin" | "leader" | "member"
  teamId?: string
}

export function AuthGuard({ children, requiredRole, teamId }: AuthGuardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login")
        return
      }

      try {
        // ユーザー情報を取得
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (!userDoc.exists()) {
          router.push("/login")
          return
        }

        const userData = userDoc.data()
        const isAdmin = userData.role === "admin"

        // 管理者の場合は常にアクセス可能
        if (isAdmin) {
          setHasAccess(true)
          setIsLoading(false)
          return
        }

        // 班のリーダー権限を確認
        if (teamId && requiredRole === "leader") {
          const teamDoc = await getDoc(doc(db, "teams", teamId))
          if (!teamDoc.exists() || teamDoc.data().leaderUid !== user.uid) {
            router.push("/dashboard")
            return
          }
        }

        // 一般部員の場合は常にアクセス可能
        if (requiredRole === "member") {
          setHasAccess(true)
          setIsLoading(false)
          return
        }

        setHasAccess(true)
      } catch (error) {
        console.error("権限チェックに失敗しました:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router, requiredRole, teamId])

  if (isLoading) {
    return <div>読み込み中...</div>
  }

  if (!hasAccess) {
    return null
  }

  return <>{children}</>
} 