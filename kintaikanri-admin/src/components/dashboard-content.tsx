"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ClockIcon, UserIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// ダミーデータ生成関数
const generateMonthData = (year, month, count) => {
  return Array.from({ length: count }, (_, i) => {
    const day = Math.min(28, Math.max(1, Math.floor(Math.random() * 28) + 1))
    const entryHour = Math.floor(Math.random() * 3) + 8 // 8-10時
    const entryMinute = Math.floor(Math.random() * 60)
    const workHours = Math.floor(Math.random() * 4) + 6 // 6-9時間
    const workMinutes = Math.floor(Math.random() * 60)

    const exitHour = Math.min(22, entryHour + workHours)
    const exitMinute = (entryMinute + workMinutes) % 60
    const adjustedExitHour = exitHour + Math.floor((entryMinute + workMinutes) / 60)

    const date = `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`
    const entryTime = `${String(entryHour).padStart(2, "0")}:${String(entryMinute).padStart(2, "0")}`
    const exitTime = `${String(adjustedExitHour).padStart(2, "0")}:${String(exitMinute).padStart(2, "0")}`
    const workTime = `${workHours}:${String(workMinutes).padStart(2, "0")}`

    return { date, entryTime, exitTime, workTime }
  }).sort((a, b) => new Date(b.date) - new Date(a.date)) // 日付の降順でソート
}

export function DashboardContent() {
  const [timeRange, setTimeRange] = useState("month")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

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

  // 拡充されたダミーデータ - 実際の実装では Firebase から取得
  const allAttendanceLogs = {}

  // 各月のダミーデータを生成
  monthOptions.forEach((option) => {
    // 一部の月はデータを少なくして、スクロールがない状態をテスト
    const entriesCount =
      option.month % 3 === 0
        ? 3 // 3件のみ（スクロールなし）
        : Math.floor(Math.random() * 10) + 10 // 10-19件（スクロールあり）

    allAttendanceLogs[option.value] = generateMonthData(option.year, option.month, entriesCount)
  })

  // 月ごとの統計情報
  const monthlyStats = {}

  // 各月の統計情報を生成
  monthOptions.forEach((option) => {
    const logs = allAttendanceLogs[option.value]
    const count = logs.length

    // 平均勤務時間を計算
    let totalMinutes = 0
    logs.forEach((log) => {
      const [hours, minutes] = log.workTime.split(":").map(Number)
      totalMinutes += hours * 60 + minutes
    })
    const avgMinutes = Math.round(totalMinutes / count)
    const avgHours = Math.floor(avgMinutes / 60)
    const avgMins = avgMinutes % 60

    // 出勤率を計算（営業日を20日と仮定）
    const rate = Math.round((count / 20) * 100)

    monthlyStats[option.value] = {
      count,
      avgTime: `${avgHours}時間${String(avgMins).padStart(2, "0")}分`,
      rate: `${rate}%`,
    }
  })

  // 年間の統計情報
  const yearlyStats = {
    count: Object.values(monthlyStats).reduce((sum, stat) => sum + stat.count, 0),
    avgTime: "6時間15分",
    rate: "75%",
  }

  // 選択した月のデータ
  const [currentLogs, setCurrentLogs] = useState(allAttendanceLogs[selectedMonth] || [])
  const [currentStats, setCurrentStats] = useState(
    monthlyStats[selectedMonth] || { count: 0, avgTime: "0時間", rate: "0%" },
  )

  // 月が変更されたときにデータを更新
  useEffect(() => {
    setCurrentLogs(allAttendanceLogs[selectedMonth] || [])
    setCurrentStats(monthlyStats[selectedMonth] || { count: 0, avgTime: "0時間", rate: "0%" })
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

  // 基本ユーザー情報
  const userData = {
    name: "山田 太郎",
    team: "開発班",
    isWorking: true,
    lastWorkDate: currentLogs[0]?.date || "データなし",
    totalAttendance: yearlyStats.count,
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
