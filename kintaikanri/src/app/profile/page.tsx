"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/firebase/config"
import { getUserInfo } from "@/lib/firebase/auth"

export default function Profile() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/auth")
        return
      }

      try {
        const info = await getUserInfo(user.uid)
        setUserInfo(info)
      } catch (err) {
        setError("ユーザー情報の取得に失敗しました")
        console.error(err)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push("/auth")
    } catch (err) {
      setError("ログアウトに失敗しました")
      console.error(err)
    }
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold">プロフィール</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          {error && (
            <p className="text-red-500 mb-4">{error}</p>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-gray-500">GitHubアカウント</p>
              <p className="text-xl font-medium">{userInfo.github}</p>
            </div>

            <div>
              <p className="text-gray-500">名前</p>
              <p className="text-xl font-medium">
                {userInfo.lastname} {userInfo.firstname}
              </p>
            </div>

            {userInfo.cardId && (
              <div>
                <p className="text-gray-500">カードID</p>
                <p className="text-xl font-medium">{userInfo.cardId}</p>
              </div>
            )}
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="mt-6 w-full"
          >
            ログアウト
          </Button>
        </div>
      </div>
    </div>
  )
} 