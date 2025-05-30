"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, Timestamp, doc, getDoc, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

type TeamMember = {
  name: string
  status: string
  totalAttendanceDays: number
  avgWorkTime: string
  attendanceRate: string
  grade: number
  enrollmentYear: number
}

type MonthlyTeamMembers = {
  [key: string]: TeamMember[]
}

type YearlyTeamMembers = {
  [key: string]: TeamMember[]
}

type SummaryData = {
  totalDays: number
  updatedAt: Date
}

interface Member {
  id: string
  name: string
  status: "出勤中" | "退勤" | "未出勤"
  lastAttendance?: {
    type: "entry" | "exit"
    timestamp: Date
  }
}

interface TeamMembersContentProps {
  teamId: string
}

export function TeamMembersContent({ teamId }: TeamMembersContentProps) {
  const [timeRange, setTimeRange] = useState("month")
  const [selectedTeam, setSelectedTeam] = useState<string>(teamId)
  const [teams, setTeams] = useState<{ id: string, name: string }[]>([])
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [selectedYear, setSelectedYear] = useState(() => {
    return new Date().getFullYear().toString()
  })
  const [monthlyTeamMembers, setMonthlyTeamMembers] = useState<MonthlyTeamMembers>({})
  const [yearlyTeamMembers, setYearlyTeamMembers] = useState<YearlyTeamMembers>({})
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 現在の年月を取得
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  // 月選択用の選択肢を生成（2024年1月から今月まで）
  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const date = new Date(currentYear, currentMonth)
    date.setMonth(date.getMonth() - i)
    
    // 2024年1月以前または今月以降は除外
    if (
      date.getFullYear() < 2024 || 
      (date.getFullYear() === 2024 && date.getMonth() < 0) ||
      date.getFullYear() > currentYear ||
      (date.getFullYear() === currentYear && date.getMonth() > currentMonth)
    ) {
      return null
    }
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: `${date.getFullYear()}年${date.getMonth() + 1}月`,
    }
  }).filter((option): option is NonNullable<typeof option> => option !== null)

  // 年選択用の選択肢を生成（2024年から今年まで）
  const yearOptions = Array.from({ length: currentYear - 2023 }, (_, i) => {
    const year = currentYear - i
    return {
      value: year.toString(),
      label: `${year}年`,
    }
  })

  // 月の移動
  const moveMonth = (direction: "prev" | "next") => {
    const [year, month] = selectedMonth.split("-").map(Number)
    const date = new Date(year, month - 1)
    date.setMonth(date.getMonth() + (direction === "prev" ? -1 : 1))
    
    // 2024年1月以前または今月以降には移動できない
    if (
      date.getFullYear() < 2024 || 
      (date.getFullYear() === 2024 && date.getMonth() < 0) ||
      date.getFullYear() > currentYear ||
      (date.getFullYear() === currentYear && date.getMonth() > currentMonth)
    ) {
      return
    }
    
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`)
  }

  // 年の移動
  const moveYear = (direction: "prev" | "next") => {
    const year = parseInt(selectedYear)
    const newYear = year + (direction === "prev" ? -1 : 1)
    
    // 2024年以前または今年以降には移動できない
    if (newYear < 2024 || newYear > currentYear) {
      return
    }
    
    setSelectedYear(newYear.toString())
  }

  // 学年を計算する関数
  const calculateStudentYear = (enrollmentYear: number) => {
    const currentYear = new Date().getFullYear()
    const yearsSinceEnrollment = currentYear - enrollmentYear
    const studentYear = yearsSinceEnrollment + 1

    if (studentYear >= 1 && studentYear <= 3) {
      return `${studentYear}年生`
    } else {
      return "卒業生"
    }
  }

  // Firestoreからデータを取得
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setIsLoading(true)
        // 班一覧を取得
        const teamsRef = collection(db, "teams")
        const teamsSnapshot = await getDocs(teamsRef)
        const teamsList = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }))
        setTeams(teamsList)

        // 選択された班のユーザー情報を取得
        const usersRef = collection(db, "users")
        const usersQuery = query(usersRef, where("teamId", "==", selectedTeam))
        const usersSnapshot = await getDocs(usersQuery)
        
        // メンバーIDのリストを取得
        const memberIds = usersSnapshot.docs.map(doc => doc.id)
        if (memberIds.length === 0) {
          setMonthlyTeamMembers({})
          setYearlyTeamMembers({})
          setMembers([])
          setIsLoading(false)
          return
        }

        // 出勤ログを取得
        const logsRef = collection(db, "attendance_logs")
        const [startDate, endDate] = timeRange === "month" 
          ? [
              new Date(selectedMonth + "-01"),
              new Date(parseInt(selectedMonth.split("-")[0]), parseInt(selectedMonth.split("-")[1]), 0)
            ]
          : [
              new Date(selectedYear + "-01-01"),
              new Date(selectedYear + "-12-31")
            ]

        const logsQuery = query(
          logsRef,
          where("uid", "in", memberIds),
          where("timestamp", ">=", Timestamp.fromDate(startDate)),
          where("timestamp", "<=", Timestamp.fromDate(endDate))
        )
        const logsSnapshot = await getDocs(logsQuery)

        // 出勤ログをユーザーごとに整理
        const userLogs = new Map<string, { entries: Timestamp[], exits: Timestamp[] }>()
        logsSnapshot.docs.forEach(doc => {
          const log = doc.data()
          if (!userLogs.has(log.uid)) {
            userLogs.set(log.uid, { entries: [], exits: [] })
          }
          if (log.type === "entry") {
            userLogs.get(log.uid)?.entries.push(log.timestamp)
          } else {
            userLogs.get(log.uid)?.exits.push(log.timestamp)
          }
        })

        // メンバー情報を生成
        const members = await Promise.all(usersSnapshot.docs.map(async (userDoc) => {
          const data = userDoc.data()
          const enrollmentYear = 2016 + data.grade - 1
          const logs = userLogs.get(userDoc.id) || { entries: [], exits: [] }
          
          // 累計出勤日数（attendance_logsから該当uidのentry数をカウント）
          const attendanceLogsQuery = query(
            collection(db, "attendance_logs"),
            where("uid", "==", userDoc.id),
            where("type", "==", "entry")
          )
          const attendanceLogsSnapshot = await getDocs(attendanceLogsQuery)
          const uniqueDays = new Set<string>()
          attendanceLogsSnapshot.forEach(logDoc => {
            const log = logDoc.data()
            const date = log.timestamp.toDate().toISOString().split('T')[0]
            uniqueDays.add(date)
          })
          const attendanceDays = uniqueDays.size

          // 平均勤務時間を計算
          let totalWorkTime = 0
          let validWorkDays = 0
          logs.entries.forEach((entry, index) => {
            const exit = logs.exits[index]
            if (exit) {
              const workTime = exit.toDate().getTime() - entry.toDate().getTime()
              // 勤務時間が1分以上の場合のみカウント
              if (workTime >= 60 * 1000) {
                totalWorkTime += workTime
                validWorkDays++
              }
            }
          })
          const avgWorkTimeMs = validWorkDays > 0 ? totalWorkTime / validWorkDays : 0
          const avgWorkHours = Math.floor(avgWorkTimeMs / (1000 * 60 * 60))
          const avgWorkMinutes = Math.floor((avgWorkTimeMs % (1000 * 60 * 60)) / (1000 * 60))
          const avgWorkTime = validWorkDays > 0 
            ? `${avgWorkHours}時間${avgWorkMinutes}分`
            : "0時間0分"

          // 出勤率を計算
          let totalWorkDays = 0
          if (timeRange === "month") {
            // 月次の場合、summaryコレクションから該当月のtotalDaysを取得
            const [year, month] = selectedMonth.split("-")
            const summaryRef = doc(db, "summary", `workdays_${year}_${month}`)
            const summaryDoc = await getDoc(summaryRef)
            if (summaryDoc.exists()) {
              const summaryData = summaryDoc.data() as { totalDays?: number }
              totalWorkDays = summaryData.totalDays ?? 0
            }
          } else {
            // 年次の場合、その年の各月のtotalDaysを合計
            const year = selectedYear
            const monthlyTotals = await Promise.all(
              Array.from({ length: 12 }, async (_, i) => {
                const month = String(i + 1).padStart(2, "0")
                const summaryRef = doc(db, "summary", `workdays_${year}_${month}`)
                const summaryDoc = await getDoc(summaryRef)
                if (summaryDoc.exists()) {
                  const data = summaryDoc.data() as { totalDays?: number }
                  return data.totalDays ?? 0
                }
                return 0
              })
            )
            totalWorkDays = monthlyTotals.reduce((sum, days) => sum + days, 0)
          }

          const attendanceRate = totalWorkDays > 0
            ? `${Math.round((attendanceDays / totalWorkDays) * 100)}%`
            : "0%"

          // 現在の勤務状況を判定
          const now = Timestamp.now()
          const lastEntry = logs.entries[logs.entries.length - 1]
          const lastExit = logs.exits[logs.exits.length - 1]
          let status: "出勤中" | "退勤" | "未出勤" = "未出勤"

          if (lastEntry) {
            if (!lastExit || lastEntry > lastExit) {
              status = "出勤中"
            } else {
              status = "退勤"
            }
          }

          return {
            id: userDoc.id,
            name: `${data.lastname} ${data.firstname}`,
            status,
            lastAttendance: lastEntry ? {
              type: lastExit && lastEntry > lastExit ? "entry" : "exit",
              timestamp: lastEntry.toDate()
            } : undefined,
            totalAttendanceDays: attendanceDays,
            avgWorkTime,
            attendanceRate,
            grade: data.grade,
            enrollmentYear
          }
        }))

        // 月次データを更新
        const monthlyData = { ...monthlyTeamMembers }
        monthlyData[selectedMonth] = members
        setMonthlyTeamMembers(monthlyData)

        // 年次データを更新
        const yearlyData = { ...yearlyTeamMembers }
        yearlyData[selectedYear] = members
        setYearlyTeamMembers(yearlyData)

        // メンバーの出退勤状況を更新
        const updatedMembers: Member[] = members.map(member => ({
          id: member.name,
          name: member.name,
          status: member.status as "出勤中" | "退勤" | "未出勤"
        }))

        setMembers(updatedMembers)
      } catch (error) {
        console.error("班員データの取得に失敗しました:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeamMembers()
  }, [selectedMonth, selectedYear, timeRange, selectedTeam])

  const teamMembers = timeRange === "month" ? monthlyTeamMembers[selectedMonth] || [] : yearlyTeamMembers[selectedYear] || []

  if (isLoading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* メンバー一覧 */}
      <Card className="shadow-sm flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-2 px-4 bg-white z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">
              {teams.find(t => t.id === selectedTeam)?.name || "班"}の班員一覧
            </CardTitle>
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveMonth("prev")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium min-w-[100px] text-center">
                      {monthOptions.find((m) => m.value === selectedMonth)?.label}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveMonth("next")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveYear("prev")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium min-w-[100px] text-center">
                      {selectedYear}年
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveYear("next")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-500">{teamMembers.length}人のメンバー</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-sm font-medium py-2 h-9">名前</TableHead>
                  <TableHead className="text-sm font-medium py-2 h-9">学年</TableHead>
                  <TableHead className="text-sm font-medium py-2 h-9">勤務状況</TableHead>
                  <TableHead className="text-sm font-medium py-2 h-9">累計出勤日数</TableHead>
                  <TableHead className="text-sm font-medium py-2 h-9">平均勤務時間</TableHead>
                  <TableHead className="text-sm font-medium py-2 h-9">出勤率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="relative">
                {teamMembers.map((member: TeamMember, index: number) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="text-sm py-1 h-9">{member.name}</TableCell>
                    <TableCell className="text-sm py-1 h-9">
                      {calculateStudentYear(member.enrollmentYear)}
                    </TableCell>
                    <TableCell className="text-sm py-1 h-9">
                      <Badge
                        variant={
                          member.status === "勤務中" ? "default" : member.status === "退勤済" ? "secondary" : "outline"
                        }
                        className="text-xs h-5"
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm py-1 h-9">{member.totalAttendanceDays}日</TableCell>
                    <TableCell className="text-sm py-1 h-9">{member.avgWorkTime}</TableCell>
                    <TableCell className="text-sm py-1 h-9">{member.attendanceRate}</TableCell>
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
