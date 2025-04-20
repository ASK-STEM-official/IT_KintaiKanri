"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { QRCodeSVG } from "qrcode.react"
import { v4 as uuidv4 } from "uuid"
import { saveToken, watchTokenStatus } from "@/lib/firebase/auth"

export default function Register() {
  const router = useRouter()
  const [token, setToken] = useState<string>("")
  const [qrValue, setQrValue] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  // トークン生成とQRコード更新
  useEffect(() => {
    const generateToken = async () => {
      try {
        const newToken = uuidv4()
        setToken(newToken)
        await saveToken(newToken)
        setQrValue(`${window.location.origin}/auth?token=${newToken}`)
        setError("")
      } catch (err) {
        setError("トークンの生成に失敗しました")
        console.error(err)
      }
    }

    generateToken()
    const intervalId = setInterval(generateToken, 300000) // 5分ごとに更新

    return () => clearInterval(intervalId)
  }, [])

  // トークンの状態監視
  useEffect(() => {
    if (!token) return

    const unsubscribe = watchTokenStatus(token, (status) => {
      if (status === "linked") {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    })

    return () => unsubscribe()
  }, [token])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold">新規登録</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="mb-4">スマートフォンでQRコードを読み取ってください</p>
          
          <div className="flex justify-center mb-6">
            <QRCodeSVG
              value={qrValue}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <p className="text-sm text-gray-500 mb-4">
            QRコードは5分ごとに更新されます
          </p>

          {error && (
            <p className="text-red-500 mb-4">{error}</p>
          )}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              キャンセル
            </Button>
            <Button
              disabled={!isAuthenticated}
              onClick={() => router.push("/register/card")}
            >
              次へ
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 