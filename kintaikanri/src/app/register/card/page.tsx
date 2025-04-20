"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function CardRegister() {
  const router = useRouter()
  const [buffer, setBuffer] = useState<string>("")
  const [cardId, setCardId] = useState<string>("")
  const [showDialog, setShowDialog] = useState<boolean>(false)

  // ページ全体でキー入力を受け付ける
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (buffer.length > 0) {
          setCardId(buffer)
          setShowDialog(true)
          setBuffer("")
        }
        return
      }

      if (/^[a-zA-Z0-9]$/.test(e.key) && buffer.length < 10) {
        setBuffer((prev) => prev + e.key)
      }
    }

    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  }, [buffer])

  const handleConfirm = async () => {
    // TODO: FirebaseにカードIDを保存
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold">カード登録</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="mb-4">NFC/RFIDカードをタッチしてください</p>

          {/* 入力中のカードID表示 */}
          {buffer && (
            <p className="text-md text-blue-600 font-mono mb-4">
              入力中: {buffer}
            </p>
          )}

          {/* 確認ダイアログ */}
          {showDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">確認</h2>
                <p className="mb-4">カードID: {cardId}</p>
                <p className="mb-6">このカードを登録しますか？</p>
                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleConfirm}
                  >
                    登録
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 