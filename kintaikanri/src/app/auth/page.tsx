"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { signInWithGitHub, watchTokenStatus } from "@/lib/firebase/auth"
import { collection, query, where, getDocs, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export default function Auth() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // トークンの有効性チェック
  useEffect(() => {
    if (!token) {
      setError("無効なトークンです")
      return
    }

    const unsubscribe = watchTokenStatus(token, (status) => {
      if (status === "linked") {
        router.push("/auth-success")
      }
    })

    return () => unsubscribe()
  }, [token, router])

  const handleGitHubLogin = async () => {
    if (!token) {
      setError("無効なトークンです")
      return
    }

    try {
      setIsLoading(true)
      setError("")
      
      const user = await signInWithGitHub()
      
      // トークンにユーザー情報を紐付け
      const q = query(collection(db, "link_requests"), where("token", "==", token))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref
        
        // トークンの状態を更新（UIDとGitHubプロフィール名を保存）
        await updateDoc(docRef, {
          uid: user.uid,
          github: user.displayName || user.email?.split('@')[0] || 'GitHub User',
          status: "linked",
          updatedAt: serverTimestamp()
        })
      } else {
        throw new Error("トークンが見つかりません")
      }

      router.push("/auth-success")
    } catch (err) {
      setError("ログインに失敗しました")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold">認証</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="mb-4">GitHubアカウントでログインしてください</p>

          {error && (
            <p className="text-red-500 mb-4">{error}</p>
          )}

          <Button
            onClick={handleGitHubLogin}
            disabled={isLoading || !token}
            className="w-full"
          >
            {isLoading ? "処理中..." : "GitHubでログイン"}
          </Button>
        </div>
      </div>
    </div>
  )
} 