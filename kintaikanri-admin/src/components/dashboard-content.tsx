"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { auth } from "@/lib/firebase/config"
import { db } from "@/lib/firebase/config"
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"

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

export function DashboardContent() {
  const [timeRange, setTimeRange] = useState("month")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [selectedYear, setSelectedYear] = useState(() => {
    return new Date().getFullYear().toString()
  })
  const [userData, setUserData] = useState<UserData | null>(null)
  const [currentLogs, setCurrentLogs] = useState<AttendanceLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 月選択用の選択肢を生成（過去12ヶ月分）
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const value = `${year}-${String(month).padStart(2, "0")}`
    const label = `${year}年${month}月`
    return { value, label }
  })

  // 年選択用の選択肢を生成（過去5年分）
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i
    return { value: year.toString(), label: `${year}年` }
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
        const teamRef = doc(db, "teams", userData.teamId)
        const teamDoc = await getDoc(teamRef)
        const teamName = teamDoc.exists() ? teamDoc.data().name : "未所属"

        // 勤怠ログを取得
        const logsRef = collection(db, "attendance_logs")
        const q = query(
          logsRef,
          where("uid", "==", auth.currentUser.uid),
          orderBy("timestamp", "desc"),
          limit(10)
        )
        const logsSnapshot = await getDocs(q)
        
        const logs = logsSnapshot.docs.map(doc => {
          const data = doc.data()
          const date = new Date(data.timestamp.toDate())
          return {
            date: `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`,
            entryTime: data.type === "entry" ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` : "-",
            exitTime: data.type === "exit" ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` : "-",
            workTime: "-" // TODO: 勤務時間の計算を実装
          }
        })

        // 出勤回数をカウント
        const attendanceCount = logsSnapshot.docs.filter(doc => doc.data().type === "entry").length

        setUserData({
          name: `${userData.lastname} ${userData.firstname}`,
          team: teamName,
          isWorking: logs[0]?.entryTime !== "-" && logs[0]?.exitTime === "-",
          lastWorkDate: logs[0]?.date || "データなし",
          totalAttendance: attendanceCount
        })
        setCurrentLogs(logs)
      } catch (error) {
        console.error("データの取得に失敗しました:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  if (isLoading || !userData) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 基本情報 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">名前</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.name}</div>
            <p className="text-xs text-muted-foreground">{userData.team}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">勤務状況</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={userData.isWorking ? "default" : "secondary"} className="text-sm">
              {userData.isWorking ? "勤務中" : "退勤済"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最終出勤日</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.lastWorkDate}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累計出勤回数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData.totalAttendance}回</div>
          </CardContent>
        </Card>
      </div>

      {/* 勤怠ログ */}
      <Card className="shadow-sm flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-2 px-4 bg-white z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">勤怠ログ</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Tabs defaultValue="month" value={timeRange} onValueChange={setTimeRange} className="w-auto">
                  <TabsList className="h-7 p-1">
                    <TabsTrigger value="month" className="text-sm px-3 py-0 h-5">
                      月次
                    </TabsTrigger>
                    <TabsTrigger value="year" className="text-sm px-3 py-0 h-5">
                      年次
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {timeRange === "month" ? (
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="h-7 text-sm w-[100px]">
                      <SelectValue placeholder="月を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-sm">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-7 text-sm w-[100px]">
                      <SelectValue placeholder="年を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-sm">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
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
                {currentLogs.map((log, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="text-sm py-1 h-9">{log.date}</TableCell>
                    <TableCell className="text-sm py-1 h-9">{log.entryTime}</TableCell>
                    <TableCell className="text-sm py-1 h-9">{log.exitTime}</TableCell>
                    <TableCell className="text-sm py-1 h-9">{log.workTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
