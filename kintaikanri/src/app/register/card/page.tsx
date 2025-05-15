"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/firebase/config"
import { collection, query, where, getDocs, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

type UserInfo = {
  uid: string
  github: string
  firstname: string
  lastname: string
  teamId: string
  grade: number
}

export default function RegisterCard() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [inputBuffer, setInputBuffer] = useState<string>("")
  const [showDialog, setShowDialog] = useState(false)
  const [teamName, setTeamName] = useState<string>("")

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/auth")
        return
      }

      setCurrentUser(user)
      try {
        // ユーザー情報を取得
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setUserInfo({
            uid: user.uid,
            github: userData.github,
            firstname: userData.firstname,
            lastname: userData.lastname,
            teamId: userData.teamId,
            grade: userData.grade
          })

          // 班情報を取得
          if (userData.teamId) {
            const teamDoc = await getDoc(doc(db, "teams", userData.teamId))
            if (teamDoc.exists()) {
              setTeamName(teamDoc.data().name)
            }
          }
        }
      } catch (err) {
        setError("ユーザー情報の取得に失敗しました")
        console.error(err)
      }
    })

    return () => unsubscribe()
  }, [router])

  // キーボード入力のイベントハンドラ
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Enterキーで確定
      if (e.key === 'Enter') {
        if (inputBuffer) {
          setShowDialog(true)
        }
        return
      }

      // 入力可能な文字のみを受け付ける（数字とアルファベット）
      if (e.key.match(/^[0-9a-zA-Z]$/)) {
        setInputBuffer(prev => prev + e.key)
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [inputBuffer])

  const handleRegister = async () => {
    if (!currentUser || !inputBuffer || !userInfo) return

    try {
      setIsLoading(true)
      setError("")

      // カードIDを追加して更新
      await setDoc(doc(db, "users", currentUser.uid), {
        ...userInfo,
        cardId: inputBuffer,
        teamId: userInfo.teamId,
        updatedAt: serverTimestamp()
      })

      router.push("/dashboard")
    } catch (err) {
      setError("カードIDの保存に失敗しました")
      console.error(err)
    } finally {
      setIsLoading(false)
      setShowDialog(false)
    }
  }

  // 期生の年度を計算
  const startYear = 2016 // 1期生の年度
  const calculateYear = (grade: number) => startYear + grade - 1

  if (!userInfo || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold">カード登録</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          {error && (
            <p className="text-red-500 mb-4">{error}</p>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-600 font-medium">
              カードをリーダーにかざしてください
            </p>
            {inputBuffer && (
              <p className="mt-2 text-sm font-mono bg-white p-2 rounded animate-pulse">
                読み取り中: {inputBuffer}
              </p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>カード登録の確認</DialogTitle>
            <DialogDescription>
              以下の情報でカードを登録します。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-gray-500">UID</p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                {userInfo.uid}
              </p>
            </div>

            <div>
              <p className="text-gray-500">GitHubプロフィール名</p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                {userInfo.github}
              </p>
            </div>

            <div>
              <p className="text-gray-500">氏名</p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                {userInfo.lastname} {userInfo.firstname}
              </p>
            </div>

            <div>
              <p className="text-gray-500">班</p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                {teamName || "未所属"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">学年</p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                {userInfo?.grade}期生 ({calculateYear(userInfo?.grade || 0)}年度入学)
              </p>
            </div>

            <div>
              <p className="text-gray-500">カードID</p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                {inputBuffer}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false)
                setInputBuffer("")
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? "登録中..." : "登録"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 