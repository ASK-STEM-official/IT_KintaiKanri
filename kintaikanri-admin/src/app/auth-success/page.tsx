"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase/config"

export default function AuthSuccess() {
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/auth")
        return
      }
    })

    return () => unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold">認証完了</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-4">
            <p className="text-green-600 text-xl font-medium">
              認証が完了しました
            </p>
            <p className="text-gray-600">
              このページを閉じてもかまいません
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}