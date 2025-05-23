"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UsersIcon, BarChart3Icon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"

export function TeamDashboardContent() {
  const [timeRange, setTimeRange] = useState("month")
  const [workingMembers, setWorkingMembers] = useState(0)
  const [totalMembers, setTotalMembers] = useState(0)

  // 年/月/日の選択状態
  const [selectedYear, setSelectedYear] = useState(() => {
    return new Date().getFullYear().toString()
  })

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return String(new Date().getMonth() + 1).padStart(2, "0")
  })

  const [selectedDay, setSelectedDay] = useState(() => {
    return String(new Date().getDate()).padStart(2, "0")
  })

  // 選択された日付を組み合わせる
  const selectedDate = `${selectedYear}-${selectedMonth}-${selectedDay}`

  // 年選択用のオプション（過去5年分）
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i
    return { value: year.toString(), label: `${year}年` }
  })

  // 月選択用のオプション（1〜12月）
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    return {
      value: String(month).padStart(2, "0"),
      label: `${month}月`,
    }
  })

  // 日選択用のオプション（1〜31日）
  // 選択された年月に基づいて日数を調整
  type DayOption = {
    value: string
    label: string
  }

  const [dayOptions, setDayOptions] = useState<DayOption[]>([])

  useEffect(() => {
    const year = Number.parseInt(selectedYear)
    const month = Number.parseInt(selectedMonth)
    const daysInMonth = new Date(year, month, 0).getDate()

    const newDayOptions = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      return {
        value: String(day).padStart(2, "0"),
        label: `${day}日`,
      }
    })

    setDayOptions(newDayOptions)

    // 選択された日が月の日数を超えている場合は調整
    if (Number.parseInt(selectedDay) > daysInMonth) {
      setSelectedDay(String(daysInMonth).padStart(2, "0"))
    }
  }, [selectedYear, selectedMonth])

  // Firestoreからデータを取得
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // 全メンバー数を取得
        const usersRef = collection(db, "users")
        const usersSnapshot = await getDocs(usersRef)
        setTotalMembers(usersSnapshot.size)

        // 勤務中のメンバーを取得
        const now = Timestamp.now()
        const logsRef = collection(db, "attendance_logs")
        const logsQuery = query(
          logsRef,
          where("timestamp", ">=", new Timestamp(now.seconds - 24 * 60 * 60, 0))
        )
        const logsSnapshot = await getDocs(logsQuery)

        // ユーザーごとの最新の出退勤状態を確認
        const userStatus = new Map<string, { lastEntry?: Timestamp, lastExit?: Timestamp }>()
        logsSnapshot.docs.forEach(doc => {
          const log = doc.data()
          const userLogs = userStatus.get(log.uid) || { lastEntry: undefined, lastExit: undefined }
          
          if (log.type === "entry") {
            if (!userLogs.lastEntry || log.timestamp > userLogs.lastEntry) {
              userLogs.lastEntry = log.timestamp
            }
          } else {
            if (!userLogs.lastExit || log.timestamp > userLogs.lastExit) {
              userLogs.lastExit = log.timestamp
            }
          }
          userStatus.set(log.uid, userLogs)
        })

        // 勤務中の人数をカウント
        let workingCount = 0
        userStatus.forEach((status) => {
          if (status.lastEntry && (!status.lastExit || status.lastEntry > status.lastExit)) {
            workingCount++
          }
        })
        setWorkingMembers(workingCount)
      } catch (error) {
        console.error("班データの取得に失敗しました:", error)
      }
    }

    fetchTeamData()
  }, [])

  // ダミーデータ - 班情報
  const teamData = {
    name: "開発班",
    totalMembers: 24,
    workingMembers: 14,
    todayAttendanceRate: "58%",
    todayAvgWorkTime: "5時間30分",
    monthlyAvgAttendance: "18人",
    monthlyAttendanceRate: "75%",
    monthlyAvgWorkTime: "6時間15分",
    yearlyAvgAttendance: "16人",
    yearlyAttendanceRate: "67%",
    yearlyAvgWorkTime: "6時間05分",
  }

  // ダミーの班員勤怠データ（開発班固定）
  type TeamMemberAttendance = {
    name: string
    entryTime: string
    exitTime: string
    workTime: string
  }

  type TeamMembersAttendance = {
    [key: string]: TeamMemberAttendance[]
  }

  const teamMembersAttendance: TeamMembersAttendance = {
    "2023-05-10": [
      { name: "山田 太郎", entryTime: "09:15", exitTime: "17:45", workTime: "8:30" },
      { name: "佐藤 次郎", entryTime: "08:45", exitTime: "16:30", workTime: "7:45" },
      { name: "鈴木 三郎", entryTime: "09:30", exitTime: "18:00", workTime: "8:30" },
      { name: "高橋 四郎", entryTime: "-", exitTime: "-", workTime: "-" },
      { name: "田中 五郎", entryTime: "10:00", exitTime: "17:30", workTime: "7:30" },
      { name: "伊藤 六郎", entryTime: "08:30", exitTime: "17:15", workTime: "8:45" },
      { name: "渡辺 七郎", entryTime: "-", exitTime: "-", workTime: "-" },
      { name: "小林 八郎", entryTime: "-", exitTime: "-", workTime: "-" },
      { name: "加藤 健太", entryTime: "09:00", exitTime: "17:30", workTime: "8:30" },
      { name: "吉田 直樹", entryTime: "08:45", exitTime: "16:15", workTime: "7:30" },
      { name: "松本 大輔", entryTime: "09:30", exitTime: "18:15", workTime: "8:45" },
      { name: "井上 誠", entryTime: "-", exitTime: "-", workTime: "-" },
      { name: "木村 拓哉", entryTime: "09:15", exitTime: "17:45", workTime: "8:30" },
      { name: "清水 洋平", entryTime: "08:30", exitTime: "16:00", workTime: "7:30" },
      { name: "中村 悠太", entryTime: "09:45", exitTime: "18:30", workTime: "8:45" },
      { name: "斎藤 健", entryTime: "-", exitTime: "-", workTime: "-" },
      { name: "近藤 真司", entryTime: "09:00", exitTime: "17:30", workTime: "8:30" },
      { name: "石田 雄大", entryTime: "08:45", exitTime: "16:15", workTime: "7:30" },
      { name: "山本 和也", entryTime: "09:30", exitTime: "18:00", workTime: "8:30" },
      { name: "藤田 一郎", entryTime: "10:00", exitTime: "17:30", workTime: "7:30" },
      { name: "中島 健太郎", entryTime: "08:30", exitTime: "17:15", workTime: "8:45" },
      { name: "岡田 隆", entryTime: "-", exitTime: "-", workTime: "-" },
      { name: "後藤 大介", entryTime: "09:15", exitTime: "17:45", workTime: "8:30" },
      { name: "村田 翔太", entryTime: "08:45", exitTime: "16:30", workTime: "7:45" },
    ],
    "2023-05-09": [
      { name: "山田 太郎", entryTime: "09:00", exitTime: "17:30", workTime: "8:30" },
      { name: "佐藤 次郎", entryTime: "08:30", exitTime: "16:15", workTime: "7:45" },
      { name: "鈴木 三郎", entryTime: "09:15", exitTime: "17:45", workTime: "8:30" },
      { name: "高橋 四郎", entryTime: "10:00", exitTime: "17:00", workTime: "7:00" },
      { name: "田中 五郎", entryTime: "09:45", exitTime: "17:15", workTime: "7:30" },
      { name: "伊藤 六郎", entryTime: "08:15", exitTime: "17:00", workTime: "8:45" },
      { name: "渡辺 七郎", entryTime: "09:30", exitTime: "16:30", workTime: "7:00" },
      { name: "小林 八郎", entryTime: "-", exitTime: "-", workTime: "-" },
      { name: "加藤 健太", entryTime: "08:45", exitTime: "17:15", workTime: "8:30" },
      { name: "吉田 直樹", entryTime: "08:30", exitTime: "16:00", workTime: "7:30" },
      { name: "松本 大輔", entryTime: "09:15", exitTime: "18:00", workTime: "8:45" },
      { name: "井上 誠", entryTime: "10:00", exitTime: "17:00", workTime: "7:00" },
      { name: "木村 拓哉", entryTime: "09:00", exitTime: "17:30", workTime: "8:30" },
      { name: "清水 洋平", entryTime: "08:15", exitTime: "15:45", workTime: "7:30" },
      { name: "中村 悠太", entryTime: "09:30", exitTime: "18:15", workTime: "8:45" },
      { name: "斎藤 健", entryTime: "-", exitTime: "-", workTime: "-" },
      { name: "近藤 真司", entryTime: "08:45", exitTime: "17:15", workTime: "8:30" },
      { name: "石田 雄大", entryTime: "08:30", exitTime: "16:00", workTime: "7:30" },
      { name: "山本 和也", entryTime: "09:15", exitTime: "17:45", workTime: "8:30" },
      { name: "藤田 一郎", entryTime: "09:45", exitTime: "17:15", workTime: "7:30" },
      { name: "中島 健太郎", entryTime: "08:15", exitTime: "17:00", workTime: "8:45" },
      { name: "岡田 隆", entryTime: "10:00", exitTime: "17:00", workTime: "7:00" },
      { name: "後藤 大介", entryTime: "09:00", exitTime: "17:30", workTime: "8:30" },
      { name: "村田 翔太", entryTime: "08:30", exitTime: "16:15", workTime: "7:45" },
    ],
  }

  // 選択された日付の班員勤怠データを取得
  const selectedDateAttendance = teamMembersAttendance[selectedDate] || []

  // 表示用の日付フォーマット
  const displayDate = `${selectedYear}年${Number.parseInt(selectedMonth)}月${Number.parseInt(selectedDay)}日`

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* 班情報と統計情報を横並びに */}
      <div className="grid grid-cols-2 gap-3">
        {/* 班別概要 - 日次情報 */}
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">開発班</CardTitle>
              <UsersIcon className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">勤務中:</span>
                <span>
                  {workingMembers}/{totalMembers}人
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">今日の出勤率:</span>
                <span>{teamData.todayAttendanceRate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">今日の平均勤務時間:</span>
                <span>{teamData.todayAvgWorkTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 班統計情報 - 月次/年次切り替え */}
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">統計情報</CardTitle>
              <BarChart3Icon className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <Tabs defaultValue="month" value={timeRange} onValueChange={setTimeRange} className="w-full">
              <div className="flex items-center justify-between mb-3">
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

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-3 bg-muted rounded-md">
                  <span className="text-xs text-muted-foreground mb-1">平均出勤人数</span>
                  <span className="text-lg font-semibold">
                    {timeRange === "month" ? teamData.monthlyAvgAttendance : teamData.yearlyAvgAttendance}
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 bg-muted rounded-md">
                  <span className="text-xs text-muted-foreground mb-1">出勤率</span>
                  <span className="text-lg font-semibold">
                    {timeRange === "month" ? teamData.monthlyAttendanceRate : teamData.yearlyAttendanceRate}
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 bg-muted rounded-md">
                  <span className="text-xs text-muted-foreground mb-1">平均勤務時間</span>
                  <span className="text-lg font-semibold">
                    {timeRange === "month" ? teamData.monthlyAvgWorkTime : teamData.yearlyAvgWorkTime}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-xs text-right text-muted-foreground">
                {timeRange === "month" ? "※ 今月の統計情報" : "※ 今年の統計情報"}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* 班員勤怠状況 - 選択した日付の詳細 */}
      <Card className="shadow-sm flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-2 px-4 bg-white z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">班員勤怠状況</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-7 text-sm w-[80px]">
                  <SelectValue placeholder="年" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-sm">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-7 text-sm w-[70px]">
                  <SelectValue placeholder="月" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-sm">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="h-7 text-sm w-[70px]">
                  <SelectValue placeholder="日" />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-sm">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-500 ml-2">
                {selectedDateAttendance.length > 0
                  ? `${selectedDateAttendance.filter((m: TeamMemberAttendance) => m.entryTime !== "-").length}/${selectedDateAttendance.length}人出勤`
                  : "データなし"}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-sm font-medium py-2 h-9">名前</TableHead>
                  <TableHead className="text-sm font-medium py-2 h-9">出勤時間</TableHead>
                  <TableHead className="text-sm font-medium py-2 h-9">退勤時間</TableHead>
                  <TableHead className="text-sm font-medium py-2 h-9">勤務時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="relative">
                {selectedDateAttendance.length > 0 ? (
                  selectedDateAttendance.map((member: TeamMemberAttendance, index: number) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="text-sm py-1 h-9">{member.name}</TableCell>
                      <TableCell className="text-sm py-1 h-9">{member.entryTime}</TableCell>
                      <TableCell className="text-sm py-1 h-9">{member.exitTime}</TableCell>
                      <TableCell className="text-sm py-1 h-9">{member.workTime}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-center py-6">
                      {displayDate}の出勤記録はありません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
