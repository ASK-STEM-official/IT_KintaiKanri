"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AuthSuccess() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/auth")
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold">認証完了</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="mb-4">認証が完了しました</p>
          <p className="text-sm text-gray-500">
            このページは3秒後に自動的に閉じます
          </p>
        </div>
      </div>
    </div>
  )
} 