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
        
        // 出退勤のペアを作成
        const attendancePairs = new Map<string, { entry?: Date; exit?: Date }[]>()
        
        // まず出勤記録を時系列順に並べる
        const sortedLogs = logsSnapshot.docs.sort((a, b) => {
          const aTime = (a.data().timestamp as Timestamp).toDate().getTime()
          const bTime = (b.data().timestamp as Timestamp).toDate().getTime()
          return aTime - bTime
        })
        
        sortedLogs.forEach(doc => {
          const data = doc.data()
          const timestamp = data.timestamp as Timestamp
          const date = timestamp.toDate()
          const dateKey = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`
          
          if (!attendancePairs.has(dateKey)) {
            attendancePairs.set(dateKey, [])
          }
          
          const pairs = attendancePairs.get(dateKey)!
          if (data.type === "entry") {
            // 新しい出勤記録を追加
            pairs.push({ entry: date })
          } else if (data.type === "exit" && pairs.length > 0) {
            // 最新の出勤記録に退勤時間を追加
            const lastPair = pairs[pairs.length - 1]
            if (!lastPair.exit) {
              lastPair.exit = date
            } else {
              // 既に退勤時間がある場合は新しいペアを作成
              pairs.push({ exit: date })
            }
          }
        })
        
        // 勤怠ログを整形
        const logs = Array.from(attendancePairs.entries()).flatMap(([date, pairs]) => {
          return pairs.map(pair => {
            let workTime = "-"
            
            if (pair.entry && pair.exit) {
              // 日付が異なる場合の処理
              const entryDate = new Date(pair.entry)
              const exitDate = new Date(pair.exit)
              
              // 日付を同じに設定して時間のみを比較
              const entryTime = new Date(entryDate)
              const exitTime = new Date(exitDate)
              exitTime.setFullYear(entryTime.getFullYear())
              exitTime.setMonth(entryTime.getMonth())
              exitTime.setDate(entryTime.getDate())
              
              // 勤務時間を計算
              const diffMs = exitTime.getTime() - entryTime.getTime()
              const diffMinutes = Math.floor(diffMs / (1000 * 60))
              const hours = Math.floor(diffMinutes / 60)
              const minutes = diffMinutes % 60
              workTime = `${hours}:${String(minutes).padStart(2, "0")}`
            }
              
            return {
              date,
              entryTime: pair.entry
                ? `${String(pair.entry.getHours()).padStart(2, "0")}:${String(pair.entry.getMinutes()).padStart(2, "0")}`
                : "-",
              exitTime: pair.exit
                ? `${String(pair.exit.getHours()).padStart(2, "0")}:${String(pair.exit.getMinutes()).padStart(2, "0")}`
                : "-",
              workTime
            }
          })
        }).sort((a, b) => {
          const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
          if (dateCompare === 0) {
            // 同じ日付の場合は出勤時間で比較（古い順）
            return a.entryTime.localeCompare(b.entryTime)
          }
          return dateCompare
        })

        // 出勤回数をカウント
        const attendanceCount = Array.from(attendancePairs.values())
          .flat()
          .filter(pair => pair.entry)
          .length

        // 全労働日数を計算（その日一人でも出勤記録がある日をカウント）
        const allAttendanceLogs = await getDocs(collection(db, "attendance_logs"))
        const workingDays = new Set<string>()
        
        allAttendanceLogs.docs.forEach(doc => {
          const data = doc.data()
          const timestamp = data.timestamp as Timestamp
          const date = timestamp.toDate()
          const dateKey = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`
          workingDays.add(dateKey)
        })

        // 月ごとの統計を計算
        const [year, month] = selectedMonth.split("-").map(Number)
        const monthLogs = logs.filter(log => {
          const [logYear, logMonth] = log.date.split("/").map(Number)
          return logYear === year && logMonth === month
        })

        // 月の労働日数を計算
        const monthWorkingDays = Array.from(workingDays).filter(date => {
          const [logYear, logMonth] = date.split("/").map(Number)
          return logYear === year && logMonth === month
        }).length

        // 年の労働日数を計算
        const yearWorkingDays = Array.from(workingDays).filter(date => {
          const [logYear] = date.split("/").map(Number)
          return logYear === year
        }).length

        // 平均勤務時間を計算
        const monthWorkTimes = monthLogs
          .filter(log => log.workTime !== "-")
          .map(log => {
            const [hours, minutes] = log.workTime.split(":").map(Number)
            return hours * 60 + minutes
          })
        
        const avgWorkMinutes = monthWorkTimes.length > 0
          ? Math.round(monthWorkTimes.reduce((sum, minutes) => sum + minutes, 0) / monthWorkTimes.length)
          : 0
        
        const avgWorkHours = Math.floor(avgWorkMinutes / 60)
        const avgWorkMins = avgWorkMinutes % 60

        const monthlyStats = {
          count: monthLogs.filter(log => log.entryTime !== "-").length,
          avgTime: avgWorkMinutes > 0
            ? `${avgWorkHours}時間${String(avgWorkMins).padStart(2, "0")}分`
            : "0時間",
          rate: monthWorkingDays > 0
            ? `${Math.round((monthLogs.filter(log => log.entryTime !== "-").length / monthWorkingDays) * 100)}%`
            : "0%"
        }

        // 年間の統計を計算
        const yearlyWorkTimes = logs
          .filter(log => log.workTime !== "-")
          .map(log => {
            const [hours, minutes] = log.workTime.split(":").map(Number)
            return hours * 60 + minutes
          })
        
        const avgYearlyWorkMinutes = yearlyWorkTimes.length > 0
          ? Math.round(yearlyWorkTimes.reduce((sum, minutes) => sum + minutes, 0) / yearlyWorkTimes.length)
          : 0
        
        const avgYearlyWorkHours = Math.floor(avgYearlyWorkMinutes / 60)
        const avgYearlyWorkMins = avgYearlyWorkMinutes % 60

        const yearlyStats = {
          count: attendanceCount,
          avgTime: avgYearlyWorkMinutes > 0
            ? `${avgYearlyWorkHours}時間${String(avgYearlyWorkMins).padStart(2, "0")}分`
            : "0時間",
          rate: yearWorkingDays > 0
            ? `${Math.round((attendanceCount / yearWorkingDays) * 100)}%`
            : "0%"
        }

        // 最新の出勤記録を取得
        const latestEntry = sortedLogs
          .filter(doc => doc.data().type === "entry")
          .pop()
        
        // 最新の退勤記録を取得
        const latestExit = sortedLogs
          .filter(doc => doc.data().type === "exit")
          .pop()

        // 勤務状況を判定（最新の出勤が最新の退勤より新しい場合は勤務中）
        const isWorking = Boolean(latestEntry && (!latestExit || 
          (latestEntry.data().timestamp as Timestamp).toDate().getTime() > 
          (latestExit.data().timestamp as Timestamp).toDate().getTime()
        ))

        setUserData({
          name: `${userData.lastname} ${userData.firstname}`,
          team: teamName,
          isWorking,
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
                        <TableCell className="text-sm py-1 h-9">
                          {log.workTime !== "-" ? (
                            <>
                              {log.workTime.split(":")[0]}時間{log.workTime.split(":")[1]}分
                            </>
                          ) : (
                            "-"
                          )}
                        </TableCell>
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

// 勤務時間を計算する関数
function calculateWorkTime(entry: Date, exit: Date): string {
  // 日付が異なる場合（日をまたぐ場合）は24時間を加算
  const exitTime = exit.getTime()
  const entryTime = entry.getTime()
  let diffMs = exitTime - entryTime
  
  // 日をまたぐ場合の処理
  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000 // 24時間をミリ秒で加算
  }
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  
  return `${hours}:${String(minutes).padStart(2, "0")}`
}
