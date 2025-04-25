"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { QRCodeSVG } from "qrcode.react"
import { v4 as uuidv4 } from "uuid"
import { saveToken, watchTokenStatus } from "@/lib/firebase/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export default function Register() {
  const router = useRouter()
  const [token, setToken] = useState<string>("")
  const [qrValue, setQrValue] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [showErrorDialog, setShowErrorDialog] = useState<boolean>(false)
  const isTokenGenerated = useRef(false) // トークン生成フラグ

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

    if (!isTokenGenerated.current) {
      generateToken()
      isTokenGenerated.current = true // トークン生成済みフラグを設定
    }

    const intervalId = setInterval(generateToken, 300000) // 5分ごとに更新

    return () => clearInterval(intervalId)
  }, [])

  // UIDの重複チェック
  const checkDuplicateUID = async (uid: string) => {
    try {
      const q = query(collection(db, "users"), where("uid", "==", uid))
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        setError("このユーザーは既に登録されています")
        setShowErrorDialog(true)
        return true
      }
      return false
    } catch (err) {
      console.error("UIDの重複チェックに失敗しました", err)
      setError("エラーが発生しました")
      setShowErrorDialog(true)
      return true
    }
  }

  // トークンの状態監視
  useEffect(() => {
    if (!token) return

    const unsubscribe = watchTokenStatus(token, async (status, data) => {
      if (status === "linked" && data?.uid) {
        const isDuplicate = await checkDuplicateUID(data.uid) // UIDを渡す
        if (!isDuplicate) {
          setIsAuthenticated(true)
        }
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
              onClick={() => router.push("/register/info")}
            >
              次へ
            </Button>
          </div>
        </div>
      </div>

      {/* エラーダイアログ */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>エラー</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {error}
          </DialogDescription>
          <DialogFooter>
            <Button onClick={() => setShowErrorDialog(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}