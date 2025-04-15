"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState<string>("")
  const [greeting, setGreeting] = useState<string>("")
  const [showGreeting, setShowGreeting] = useState<boolean>(false)
  const [buffer, setBuffer] = useState<string>("")

  // 時刻更新
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, "0")
      const minutes = now.getMinutes().toString().padStart(2, "0")
      setCurrentTime(`${hours}:${minutes}`)
    }

    updateTime()
    const intervalId = setInterval(updateTime, 60000)
    return () => clearInterval(intervalId)
  }, [])

  // ページ全体でキー入力を受け付ける
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (buffer.length > 0) {
          simulateAttendance("entry", `ID: ${buffer}`)
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

  // 勤怠挨拶処理
  const simulateAttendance = (type: "entry" | "exit", name: string) => {
    if (type === "entry") {
      setGreeting(`${name} さん、いってらっしゃい`)
    } else {
      setGreeting(`${name} さん、お疲れ様でした`)
    }

    setShowGreeting(true)

    setTimeout(() => {
      setShowGreeting(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4 text-center">
        <h2 className="text-2xl font-bold">STEM研究部</h2>
        <h1 className="text-6xl font-bold">{currentTime}</h1>

        {showGreeting && (
          <h3 className="text-xl font-medium text-green-600">{greeting}</h3>
        )}

        <h3 className="text-xl font-medium">NFC/RFIDカードをタッチしてください</h3>

        {/* 入力中のカードID表示（任意） */}
        {buffer && (
          <p className="text-md text-blue-600 font-mono">
            入力中: {buffer}
          </p>
        )}

        {/* 新規登録 */}
        <Link href="/register">
          <Button size="lg">新規登録</Button>
        </Link>
      </div>
    </div>
  )
}
