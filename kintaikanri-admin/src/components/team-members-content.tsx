"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"

type TeamMember = {
  name: string
  status: string
  totalAttendance: number
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

export function TeamMembersContent() {
  const [timeRange, setTimeRange] = useState("month")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [selectedYear, setSelectedYear] = useState(() => {
    return new Date().getFullYear().toString()
  })
  const [monthlyTeamMembers, setMonthlyTeamMembers] = useState<MonthlyTeamMembers>({})
  const [yearlyTeamMembers, setYearlyTeamMembers] = useState<YearlyTeamMembers>({})

  // 月選択用の選択肢を生成（過去12ヶ月分）
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: `${date.getFullYear()}年${date.getMonth() + 1}月`,
    }
  })

  // 年選択用の選択肢を生成（過去5年分）
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i
    return {
      value: year.toString(),
      label: `${year}年`,
    }
  })

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
        const usersRef = collection(db, "users")
        const usersSnapshot = await getDocs(usersRef)
        
        const members = usersSnapshot.docs.map(doc => {
          const data = doc.data()
          const enrollmentYear = 2016 + data.grade - 1 // 入学年度を計算
          
          return {
            name: `${data.lastname} ${data.firstname}`,
            status: "未出勤", // デフォルト値
            totalAttendance: 0, // デフォルト値
            avgWorkTime: "0時間", // デフォルト値
            attendanceRate: "0%", // デフォルト値
            grade: data.grade,
            enrollmentYear: enrollmentYear
          }
        })

        // 月次データを更新
        const monthlyData = { ...monthlyTeamMembers }
        monthlyData[selectedMonth] = members
        setMonthlyTeamMembers(monthlyData)

        // 年次データを更新
        const yearlyData = { ...yearlyTeamMembers }
        yearlyData[selectedYear] = members
        setYearlyTeamMembers(yearlyData)
      } catch (error) {
        console.error("班員データの取得に失敗しました:", error)
      }
    }

    fetchTeamMembers()
  }, [selectedMonth, selectedYear])

  const teamMembers = timeRange === "month" ? monthlyTeamMembers[selectedMonth] || [] : yearlyTeamMembers[selectedYear] || []

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* メンバー一覧 */}
      <Card className="shadow-sm flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-2 px-4 bg-white z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">班員一覧</CardTitle>
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
                  <TableHead className="text-sm font-medium py-2 h-9">累計出勤回数</TableHead>
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
                    <TableCell className="text-sm py-1 h-9">{member.totalAttendance}回</TableCell>
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
