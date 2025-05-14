"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ClockIcon, UserIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { auth } from "@/lib/firebase/config"
import { db } from "@/lib/firebase/config"
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore"

type AttendanceLog = {
  date: string
  entryTime: string
  exitTime: string
  workTime: string
}

type UserData = {
  name: string
  team: string
  isWorking: boolean
  lastWorkDate: string
  totalAttendance: number
}

type MonthlyStats = {
  count: number
  avgTime: string
  rate: string
}

export function DashboardContent() {
  const [timeRange, setTimeRange] = useState("month")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [userData, setUserData] = useState<UserData | null>(null)
  const [currentLogs, setCurrentLogs] = useState<AttendanceLog[]>([])
  const [currentStats, setCurrentStats] = useState<MonthlyStats>({ count: 0, avgTime: "0時間", rate: "0%" })
  const [yearlyStats, setYearlyStats] = useState<MonthlyStats>({ count: 0, avgTime: "0時間", rate: "0%" })
  const [isLoading, setIsLoading] = useState(true)

  // 月選択用の選択肢を生成（過去12ヶ月分）
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const value = `${year}-${String(month).padStart(2, "0")}`
    const label = `${year}年${month}月`
    return { value, label, year, month }
  })

  // ユーザー情報と勤怠データを取得
  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return

      setIsLoading(true)
      try {
        // ユーザー情報を取得
        const userRef = doc(db, "users", auth.currentUser.uid)
        const userDoc = await getDoc(userRef)
        if (!userDoc.exists()) return

        const userData = userDoc.data()
        let teamName = "未所属"

        // teamIdが存在する場合のみ班情報を取得
        if (userData.teamId) {
          try {
            const teamRef = doc(db, "teams", userData.teamId)
            const teamDoc = await getDoc(teamRef)
            if (teamDoc.exists()) {
              const teamData = teamDoc.data()
              teamName = teamData.name || "未所属"
            }
          } catch (error) {
            console.error("班情報の取得に失敗しました:", error)
          }
        }

        // 勤怠ログを取得
        const logsRef = collection(db, "attendance_logs")
        const q = query(
          logsRef,
          where("uid", "==", auth.currentUser.uid),
          orderBy("timestamp", "desc"),
          limit(100)
        )
        const logsSnapshot = await getDocs(q)
        
        const logs = logsSnapshot.docs.map(doc => {
          const data = doc.data()
          const timestamp = data.timestamp as Timestamp
          const date = timestamp.toDate()
          return {
            date: `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`,
            entryTime: data.type === "entry" ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` : "-",
            exitTime: data.type === "exit" ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` : "-",
            workTime: "-" // TODO: 勤務時間の計算を実装
          }
        })

        // 出勤回数をカウント
        const attendanceCount = logsSnapshot.docs.filter(doc => doc.data().type === "entry").length

        // 月ごとの統計を計算
        const [year, month] = selectedMonth.split("-").map(Number)
        const monthLogs = logs.filter(log => {
          const [logYear, logMonth] = log.date.split("/").map(Number)
          return logYear === year && logMonth === month
        })

        const monthlyStats = {
          count: monthLogs.filter(log => log.entryTime !== "-").length,
          avgTime: "0時間", // TODO: 平均勤務時間の計算を実装
          rate: `${Math.round((monthLogs.filter(log => log.entryTime !== "-").length / 20) * 100)}%`
        }

        // 年間の統計を計算
        const yearlyStats = {
          count: attendanceCount,
          avgTime: "0時間", // TODO: 平均勤務時間の計算を実装
          rate: `${Math.round((attendanceCount / 240) * 100)}%` // 年間営業日を240日と仮定
        }

        setUserData({
          name: `${userData.lastname} ${userData.firstname}`,
          team: teamName,
          isWorking: logs[0]?.entryTime !== "-" && logs[0]?.exitTime === "-",
          lastWorkDate: logs[0]?.date || "データなし",
          totalAttendance: attendanceCount
        })
        setCurrentLogs(monthLogs)
        setCurrentStats(monthlyStats)
        setYearlyStats(yearlyStats)
      } catch (error) {
        console.error("データの取得に失敗しました:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [selectedMonth])

  // 前月・翌月に移動する関数
  const goToPreviousMonth = () => {
    const index = monthOptions.findIndex((option) => option.value === selectedMonth)
    if (index < monthOptions.length - 1) {
      setSelectedMonth(monthOptions[index + 1].value)
    }
  }

  const goToNextMonth = () => {
    const index = monthOptions.findIndex((option) => option.value === selectedMonth)
    if (index > 0) {
      setSelectedMonth(monthOptions[index - 1].value)
    }
  }

  if (isLoading || !userData) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  // 現在選択中の月のラベルを取得
  const currentMonthLabel = monthOptions.find((option) => option.value === selectedMonth)?.label || "選択月"

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* 上部情報セクション */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">ユーザー情報</CardTitle>
              <UserIcon className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">名前:</span>
                <span>{userData.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">所属班:</span>
                <span>{userData.team}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">勤務状況:</span>
                <Badge variant={userData.isWorking ? "default" : "outline"} className="text-sm h-6">
                  {userData.isWorking ? "勤務中" : "退勤済み"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">勤務状況</CardTitle>
              <ClockIcon className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">前回出勤日:</span>
                <span>{userData.lastWorkDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">今月の出勤回数:</span>
                <span>{timeRange === "month" ? `${currentStats.count}回` : "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">累計出勤回数:</span>
                <span>{userData.totalAttendance}回</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">勤務統計</CardTitle>
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <Tabs defaultValue="month" value={timeRange} onValueChange={setTimeRange} className="w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">表示期間:</span>
                <TabsList className="h-7 p-1">
                  <TabsTrigger value="month" className="text-sm px-3 py-0 h-5">
                    月次
                  </TabsTrigger>
                  <TabsTrigger value="year" className="text-sm px-3 py-0 h-5">
                    年次
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">出勤率:</span>
                  <span>{timeRange === "month" ? currentStats.rate : yearlyStats.rate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">平均勤務時間:</span>
                  <span>{timeRange === "month" ? currentStats.avgTime : yearlyStats.avgTime}</span>
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* 出退勤履歴セクション */}
      <Card className="shadow-sm flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-2 px-4 bg-white z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-medium">出退勤履歴</CardTitle>
              <div className="flex items-center gap-2 ml-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={goToPreviousMonth}
                  disabled={
                    monthOptions.findIndex((option) => option.value === selectedMonth) === monthOptions.length - 1
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-7 text-sm border px-2 w-[120px]">
                    <SelectValue placeholder="月を選択">{currentMonthLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-sm">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={goToNextMonth}
                  disabled={monthOptions.findIndex((option) => option.value === selectedMonth) === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-gray-500">{currentStats.count}件の記録</div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-sm font-medium py-2 h-9">日付</TableHead>
                  <TableHead className="text-sm font-medium py-2 h-9">出勤時間</TableHead>
                  <TableHead className="text-sm font-medium py-2 h-9">退勤時間</TableHead>
                  <TableHead className="text-sm font-medium py-2 h-9">勤務時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="relative">
                {currentLogs.length > 0 ? (
                  <>
                    {currentLogs.map((log, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="text-sm py-1 h-9">{log.date}</TableCell>
                        <TableCell className="text-sm py-1 h-9">{log.entryTime}</TableCell>
                        <TableCell className="text-sm py-1 h-9">{log.exitTime}</TableCell>
                        <TableCell className="text-sm py-1 h-9">{log.workTime}</TableCell>
                      </TableRow>
                    ))}
                    {/* 空行を追加して高さを維持 */}
                    {currentLogs.length < 10 && (
                      <tr style={{ height: `${(10 - currentLogs.length) * 36}px` }}>
                        <td colSpan={4}></td>
                      </tr>
                    )}
                  </>
                ) : (
                  <>
                    <TableRow>
                      <TableCell colSpan={4} className="text-sm text-center py-6">
                        この月の出勤記録はありません
                      </TableCell>
                    </TableRow>
                    {/* 空行を追加して高さを維持 */}
                    <tr style={{ height: "324px" }}>
                      <td colSpan={4}></td>
                    </tr>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
