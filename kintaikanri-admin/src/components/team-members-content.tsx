"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function TeamMembersContent() {
  const [timeRange, setTimeRange] = useState("month")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [selectedYear, setSelectedYear] = useState(() => {
    return new Date().getFullYear().toString()
  })

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

  // 月次データの部分を以下に置き換え
  // ダミーの班メンバーデータ（開発班固定）
  type TeamMember = {
    name: string
    status: string
    totalAttendance: number
    avgWorkTime: string
    attendanceRate: string
  }

  type MonthlyTeamMembers = {
    [key: string]: TeamMember[]
  }

  type YearlyTeamMembers = {
    [key: string]: TeamMember[]
  }

  const monthlyTeamMembers: MonthlyTeamMembers = {
    "2023-05": [
      { name: "山田 太郎", status: "勤務中", totalAttendance: 18, avgWorkTime: "6時間15分", attendanceRate: "90%" },
      { name: "佐藤 次郎", status: "勤務中", totalAttendance: 16, avgWorkTime: "7時間30分", attendanceRate: "80%" },
      { name: "鈴木 三郎", status: "勤務中", totalAttendance: 20, avgWorkTime: "5時間45分", attendanceRate: "100%" },
      { name: "高橋 四郎", status: "未出勤", totalAttendance: 12, avgWorkTime: "6時間00分", attendanceRate: "60%" },
      { name: "田中 五郎", status: "勤務中", totalAttendance: 17, avgWorkTime: "6時間30分", attendanceRate: "85%" },
      { name: "伊藤 六郎", status: "勤務中", totalAttendance: 15, avgWorkTime: "7時間00分", attendanceRate: "75%" },
      { name: "渡辺 七郎", status: "退勤済", totalAttendance: 14, avgWorkTime: "5時間30分", attendanceRate: "70%" },
      { name: "小林 八郎", status: "未出勤", totalAttendance: 10, avgWorkTime: "6時間45分", attendanceRate: "50%" },
      { name: "加藤 健太", status: "勤務中", totalAttendance: 19, avgWorkTime: "6時間20分", attendanceRate: "95%" },
      { name: "吉田 直樹", status: "退勤済", totalAttendance: 15, avgWorkTime: "5時間50分", attendanceRate: "75%" },
      { name: "松本 大輔", status: "勤務中", totalAttendance: 17, avgWorkTime: "7時間10分", attendanceRate: "85%" },
      { name: "井上 誠", status: "未出勤", totalAttendance: 11, avgWorkTime: "6時間05分", attendanceRate: "55%" },
      { name: "木村 拓哉", status: "勤務中", totalAttendance: 16, avgWorkTime: "6時間40分", attendanceRate: "80%" },
      { name: "清水 洋平", status: "退勤済", totalAttendance: 13, avgWorkTime: "5時間55分", attendanceRate: "65%" },
      { name: "中村 悠太", status: "勤務中", totalAttendance: 18, avgWorkTime: "6時間25分", attendanceRate: "90%" },
      { name: "斎藤 健", status: "未出勤", totalAttendance: 9, avgWorkTime: "5時間40分", attendanceRate: "45%" },
      { name: "近藤 真司", status: "勤務中", totalAttendance: 14, avgWorkTime: "7時間05分", attendanceRate: "70%" },
      { name: "石田 雄大", status: "退勤済", totalAttendance: 12, avgWorkTime: "6時間10分", attendanceRate: "60%" },
    ],
    "2023-04": [
      { name: "山田 太郎", status: "退勤済", totalAttendance: 19, avgWorkTime: "6時間30分", attendanceRate: "95%" },
      { name: "佐藤 次郎", status: "退勤済", totalAttendance: 17, avgWorkTime: "7時間15分", attendanceRate: "85%" },
      { name: "鈴木 三郎", status: "退勤済", totalAttendance: 18, avgWorkTime: "6時間00分", attendanceRate: "90%" },
      { name: "高橋 四郎", status: "退勤済", totalAttendance: 14, avgWorkTime: "5時間45分", attendanceRate: "70%" },
      { name: "田中 五郎", status: "退勤済", totalAttendance: 16, avgWorkTime: "6時間45分", attendanceRate: "80%" },
      { name: "伊藤 六郎", status: "退勤済", totalAttendance: 15, avgWorkTime: "7時間30分", attendanceRate: "75%" },
      { name: "渡辺 七郎", status: "退勤済", totalAttendance: 13, avgWorkTime: "5時間15分", attendanceRate: "65%" },
      { name: "小林 八郎", status: "退勤済", totalAttendance: 12, avgWorkTime: "6時間30分", attendanceRate: "60%" },
      { name: "加藤 健太", status: "退勤済", totalAttendance: 20, avgWorkTime: "6時間10分", attendanceRate: "100%" },
      { name: "吉田 直樹", status: "退勤済", totalAttendance: 16, avgWorkTime: "5時間40分", attendanceRate: "80%" },
      { name: "松本 大輔", status: "退勤済", totalAttendance: 18, avgWorkTime: "7時間00分", attendanceRate: "90%" },
      { name: "井上 誠", status: "退勤済", totalAttendance: 12, avgWorkTime: "6時間15分", attendanceRate: "60%" },
      { name: "木村 拓哉", status: "退勤済", totalAttendance: 17, avgWorkTime: "6時間50分", attendanceRate: "85%" },
      { name: "清水 洋平", status: "退勤済", totalAttendance: 14, avgWorkTime: "5時間35分", attendanceRate: "70%" },
      { name: "中村 悠太", status: "退勤済", totalAttendance: 19, avgWorkTime: "6時間20分", attendanceRate: "95%" },
      { name: "斎藤 健", status: "退勤済", totalAttendance: 10, avgWorkTime: "5時間50分", attendanceRate: "50%" },
      { name: "近藤 真司", status: "退勤済", totalAttendance: 15, avgWorkTime: "7時間15分", attendanceRate: "75%" },
      { name: "石田 雄大", status: "退勤済", totalAttendance: 13, avgWorkTime: "6時間05分", attendanceRate: "65%" },
    ],
    "2023-03": [
      { name: "山田 太郎", status: "退勤済", totalAttendance: 20, avgWorkTime: "6時間25分", attendanceRate: "100%" },
      { name: "佐藤 次郎", status: "退勤済", totalAttendance: 18, avgWorkTime: "7時間10分", attendanceRate: "90%" },
      { name: "鈴木 三郎", status: "退勤済", totalAttendance: 19, avgWorkTime: "5時間55分", attendanceRate: "95%" },
      { name: "高橋 四郎", status: "退勤済", totalAttendance: 15, avgWorkTime: "6時間05分", attendanceRate: "75%" },
      { name: "田中 五郎", status: "退勤済", totalAttendance: 17, avgWorkTime: "6時間40分", attendanceRate: "85%" },
      { name: "伊藤 六郎", status: "退勤済", totalAttendance: 16, avgWorkTime: "7時間20分", attendanceRate: "80%" },
      { name: "渡辺 七郎", status: "退勤済", totalAttendance: 14, avgWorkTime: "5時間30分", attendanceRate: "70%" },
      { name: "小林 八郎", status: "退勤済", totalAttendance: 13, avgWorkTime: "6時間15分", attendanceRate: "65%" },
      { name: "加藤 健太", status: "退勤済", totalAttendance: 19, avgWorkTime: "6時間30分", attendanceRate: "95%" },
      { name: "吉田 直樹", status: "退勤済", totalAttendance: 15, avgWorkTime: "5時間45分", attendanceRate: "75%" },
      { name: "松本 大輔", status: "退勤済", totalAttendance: 17, avgWorkTime: "7時間05分", attendanceRate: "85%" },
      { name: "井上 誠", status: "退勤済", totalAttendance: 11, avgWorkTime: "6時間00分", attendanceRate: "55%" },
      { name: "木村 拓哉", status: "退勤済", totalAttendance: 16, avgWorkTime: "6時間35分", attendanceRate: "80%" },
      { name: "清水 洋平", status: "退勤済", totalAttendance: 12, avgWorkTime: "5時間50分", attendanceRate: "60%" },
      { name: "中村 悠太", status: "退勤済", totalAttendance: 18, avgWorkTime: "6時間20分", attendanceRate: "90%" },
      { name: "斎藤 健", status: "退勤済", totalAttendance: 10, avgWorkTime: "5時間40分", attendanceRate: "50%" },
      { name: "近藤 真司", status: "退勤済", totalAttendance: 14, avgWorkTime: "7時間15分", attendanceRate: "70%" },
      { name: "石田 雄大", status: "退勤済", totalAttendance: 13, avgWorkTime: "6時間10分", attendanceRate: "65%" },
      { name: "山本 和也", status: "退勤済", totalAttendance: 16, avgWorkTime: "6時間45分", attendanceRate: "80%" },
      { name: "藤田 一郎", status: "退勤済", totalAttendance: 15, avgWorkTime: "5時間55分", attendanceRate: "75%" },
    ],
    "2023-02": [
      { name: "山田 太郎", status: "退勤済", totalAttendance: 18, avgWorkTime: "6時間20分", attendanceRate: "90%" },
      { name: "佐藤 次郎", status: "退勤済", totalAttendance: 16, avgWorkTime: "7時間05分", attendanceRate: "80%" },
      { name: "鈴木 三郎", status: "退勤済", totalAttendance: 17, avgWorkTime: "5時間50分", attendanceRate: "85%" },
      { name: "高橋 四郎", status: "退勤済", totalAttendance: 13, avgWorkTime: "6時間10分", attendanceRate: "65%" },
      { name: "田中 五郎", status: "退勤済", totalAttendance: 15, avgWorkTime: "6時間35分", attendanceRate: "75%" },
      { name: "伊藤 六郎", status: "退勤済", totalAttendance: 14, avgWorkTime: "7時間15分", attendanceRate: "70%" },
      { name: "渡辺 七郎", status: "退勤済", totalAttendance: 12, avgWorkTime: "5時間25分", attendanceRate: "60%" },
      { name: "小林 八郎", status: "退勤済", totalAttendance: 11, avgWorkTime: "6時間00分", attendanceRate: "55%" },
      { name: "加藤 健太", status: "退勤済", totalAttendance: 17, avgWorkTime: "6時間25分", attendanceRate: "85%" },
      { name: "吉田 直樹", status: "退勤済", totalAttendance: 13, avgWorkTime: "5時間40分", attendanceRate: "65%" },
      { name: "松本 大輔", status: "退勤済", totalAttendance: 15, avgWorkTime: "7時間00分", attendanceRate: "75%" },
      { name: "井上 誠", status: "退勤済", totalAttendance: 10, avgWorkTime: "5時間55分", attendanceRate: "50%" },
      { name: "木村 拓哉", status: "退勤済", totalAttendance: 14, avgWorkTime: "6時間30分", attendanceRate: "70%" },
      { name: "清水 洋平", status: "退勤済", totalAttendance: 11, avgWorkTime: "5時間45分", attendanceRate: "55%" },
      { name: "中村 悠太", status: "退勤済", totalAttendance: 16, avgWorkTime: "6時間15分", attendanceRate: "80%" },
      { name: "斎藤 健", status: "退勤済", totalAttendance: 9, avgWorkTime: "5時間35分", attendanceRate: "45%" },
      { name: "近藤 真司", status: "退勤済", totalAttendance: 13, avgWorkTime: "7時間10分", attendanceRate: "65%" },
      { name: "石田 雄大", status: "退勤済", totalAttendance: 12, avgWorkTime: "6時間05分", attendanceRate: "60%" },
      { name: "山本 和也", status: "退勤済", totalAttendance: 15, avgWorkTime: "6時間40分", attendanceRate: "75%" },
      { name: "藤田 一郎", status: "退勤済", totalAttendance: 14, avgWorkTime: "5時間50分", attendanceRate: "70%" },
    ],
  }

  // 年次データの部分を以下に置き換え
  // 年次データ
  const yearlyTeamMembers: YearlyTeamMembers = {
    "2023": [
      { name: "山田 太郎", status: "勤務中", totalAttendance: 210, avgWorkTime: "6時間20分", attendanceRate: "87%" },
      { name: "佐藤 次郎", status: "勤務中", totalAttendance: 195, avgWorkTime: "7時間10分", attendanceRate: "81%" },
      { name: "鈴木 三郎", status: "勤務中", totalAttendance: 220, avgWorkTime: "5時間50分", attendanceRate: "92%" },
      { name: "高橋 四郎", status: "未出勤", totalAttendance: 160, avgWorkTime: "6時間05分", attendanceRate: "67%" },
      { name: "田中 五郎", status: "勤務中", totalAttendance: 200, avgWorkTime: "6時間35分", attendanceRate: "83%" },
      { name: "伊藤 六郎", status: "勤務中", totalAttendance: 185, avgWorkTime: "7時間15分", attendanceRate: "77%" },
      { name: "渡辺 七郎", status: "退勤済", totalAttendance: 175, avgWorkTime: "5時間25分", attendanceRate: "73%" },
      { name: "小林 八郎", status: "未出勤", totalAttendance: 150, avgWorkTime: "6時間40分", attendanceRate: "62%" },
      { name: "加藤 健太", status: "勤務中", totalAttendance: 215, avgWorkTime: "6時間25分", attendanceRate: "90%" },
      { name: "吉田 直樹", status: "退勤済", totalAttendance: 180, avgWorkTime: "5時間45分", attendanceRate: "75%" },
      { name: "松本 大輔", status: "勤務中", totalAttendance: 205, avgWorkTime: "7時間05分", attendanceRate: "85%" },
      { name: "井上 誠", status: "未出勤", totalAttendance: 145, avgWorkTime: "6時間00分", attendanceRate: "60%" },
      { name: "木村 拓哉", status: "勤務中", totalAttendance: 190, avgWorkTime: "6時間30分", attendanceRate: "79%" },
      { name: "清水 洋平", status: "退勤済", totalAttendance: 170, avgWorkTime: "5時間50分", attendanceRate: "71%" },
      { name: "中村 悠太", status: "勤務中", totalAttendance: 210, avgWorkTime: "6時間15分", attendanceRate: "88%" },
      { name: "斎藤 健", status: "未出勤", totalAttendance: 135, avgWorkTime: "5時間40分", attendanceRate: "56%" },
      { name: "近藤 真司", status: "勤務中", totalAttendance: 175, avgWorkTime: "7時間10分", attendanceRate: "73%" },
      { name: "石田 雄大", status: "退勤済", totalAttendance: 165, avgWorkTime: "6時間05分", attendanceRate: "69%" },
      { name: "山本 和也", status: "勤務中", totalAttendance: 195, avgWorkTime: "6時間40分", attendanceRate: "81%" },
      { name: "藤田 一郎", status: "退勤済", totalAttendance: 180, avgWorkTime: "5時間55分", attendanceRate: "75%" },
      { name: "中島 健太郎", status: "勤務中", totalAttendance: 200, avgWorkTime: "6時間25分", attendanceRate: "83%" },
      { name: "岡田 隆", status: "未出勤", totalAttendance: 155, avgWorkTime: "6時間10分", attendanceRate: "65%" },
      { name: "後藤 大介", status: "勤務中", totalAttendance: 185, avgWorkTime: "7時間00分", attendanceRate: "77%" },
      { name: "村田 翔太", status: "退勤済", totalAttendance: 170, avgWorkTime: "5時間45分", attendanceRate: "71%" },
    ],
    "2022": [
      { name: "山田 太郎", status: "退勤済", totalAttendance: 200, avgWorkTime: "6時間10分", attendanceRate: "83%" },
      { name: "佐藤 次郎", status: "退勤済", totalAttendance: 190, avgWorkTime: "7時間00分", attendanceRate: "79%" },
      { name: "鈴木 三郎", status: "退勤済", totalAttendance: 215, avgWorkTime: "5時間40分", attendanceRate: "90%" },
      { name: "高橋 四郎", status: "退勤済", totalAttendance: 155, avgWorkTime: "5時間55分", attendanceRate: "65%" },
      { name: "田中 五郎", status: "退勤済", totalAttendance: 195, avgWorkTime: "6時間25分", attendanceRate: "81%" },
      { name: "伊藤 六郎", status: "退勤済", totalAttendance: 180, avgWorkTime: "7時間05分", attendanceRate: "75%" },
      { name: "渡辺 七郎", status: "退勤済", totalAttendance: 170, avgWorkTime: "5時間15分", attendanceRate: "71%" },
      { name: "小林 八郎", status: "退勤済", totalAttendance: 145, avgWorkTime: "6時間30分", attendanceRate: "60%" },
      { name: "加藤 健太", status: "退勤済", totalAttendance: 205, avgWorkTime: "6時間15分", attendanceRate: "85%" },
      { name: "吉田 直樹", status: "退勤済", totalAttendance: 175, avgWorkTime: "5時間35分", attendanceRate: "73%" },
      { name: "松本 大輔", status: "退勤済", totalAttendance: 195, avgWorkTime: "6時間55分", attendanceRate: "81%" },
      { name: "井上 誠", status: "退勤済", totalAttendance: 140, avgWorkTime: "5時間50分", attendanceRate: "58%" },
      { name: "木村 拓哉", status: "退勤済", totalAttendance: 185, avgWorkTime: "6時間20分", attendanceRate: "77%" },
      { name: "清水 洋平", status: "退勤済", totalAttendance: 165, avgWorkTime: "5時間40分", attendanceRate: "69%" },
      { name: "中村 悠太", status: "退勤済", totalAttendance: 200, avgWorkTime: "6時間05分", attendanceRate: "83%" },
      { name: "斎藤 健", status: "退勤済", totalAttendance: 130, avgWorkTime: "5時間30分", attendanceRate: "54%" },
      { name: "近藤 真司", status: "退勤済", totalAttendance: 170, avgWorkTime: "7時間00分", attendanceRate: "71%" },
      { name: "石田 雄大", status: "退勤済", totalAttendance: 160, avgWorkTime: "5時間55分", attendanceRate: "67%" },
      { name: "山本 和也", status: "退勤済", totalAttendance: 190, avgWorkTime: "6時間30分", attendanceRate: "79%" },
      { name: "藤田 一郎", status: "退勤済", totalAttendance: 175, avgWorkTime: "5時間45分", attendanceRate: "73%" },
      { name: "中島 健太郎", status: "退勤済", totalAttendance: 195, avgWorkTime: "6時間15分", attendanceRate: "81%" },
      { name: "岡田 隆", status: "退勤済", totalAttendance: 150, avgWorkTime: "6時間00分", attendanceRate: "62%" },
      { name: "後藤 大介", status: "退勤済", totalAttendance: 180, avgWorkTime: "6時間50分", attendanceRate: "75%" },
      { name: "村田 翔太", status: "退勤済", totalAttendance: 165, avgWorkTime: "5時間35分", attendanceRate: "69%" },
    ],
    "2021": [
      { name: "山田 太郎", status: "退勤済", totalAttendance: 195, avgWorkTime: "6時間05分", attendanceRate: "81%" },
      { name: "佐藤 次郎", status: "退勤済", totalAttendance: 185, avgWorkTime: "6時間55分", attendanceRate: "77%" },
      { name: "鈴木 三郎", status: "退勤済", totalAttendance: 210, avgWorkTime: "5時間35分", attendanceRate: "88%" },
      { name: "高橋 四郎", status: "退勤済", totalAttendance: 150, avgWorkTime: "5時間50分", attendanceRate: "62%" },
      { name: "田中 五郎", status: "退勤済", totalAttendance: 190, avgWorkTime: "6時間20分", attendanceRate: "79%" },
      { name: "伊藤 六郎", status: "退勤済", totalAttendance: 175, avgWorkTime: "7時間00分", attendanceRate: "73%" },
      { name: "渡辺 七郎", status: "退勤済", totalAttendance: 165, avgWorkTime: "5時間10分", attendanceRate: "69%" },
      { name: "小林 八郎", status: "退勤済", totalAttendance: 140, avgWorkTime: "6時間25分", attendanceRate: "58%" },
      { name: "加藤 健太", status: "退勤済", totalAttendance: 200, avgWorkTime: "6時間10分", attendanceRate: "83%" },
      { name: "吉田 直樹", status: "退勤済", totalAttendance: 170, avgWorkTime: "5時間30分", attendanceRate: "71%" },
      { name: "松本 大輔", status: "退勤済", totalAttendance: 190, avgWorkTime: "6時間50分", attendanceRate: "79%" },
      { name: "井上 誠", status: "退勤済", totalAttendance: 135, avgWorkTime: "5時間45分", attendanceRate: "56%" },
      { name: "木村 拓哉", status: "退勤済", totalAttendance: 180, avgWorkTime: "6時間15分", attendanceRate: "75%" },
      { name: "清水 洋平", status: "退勤済", totalAttendance: 160, avgWorkTime: "5時間35分", attendanceRate: "67%" },
      { name: "中村 悠太", status: "退勤済", totalAttendance: 195, avgWorkTime: "6時間00分", attendanceRate: "81%" },
      { name: "斎藤 健", status: "退勤済", totalAttendance: 125, avgWorkTime: "5時間25分", attendanceRate: "52%" },
      { name: "近藤 真司", status: "退勤済", totalAttendance: 165, avgWorkTime: "6時間55分", attendanceRate: "69%" },
      { name: "石田 雄大", status: "退勤済", totalAttendance: 155, avgWorkTime: "5時間50分", attendanceRate: "65%" },
      { name: "山本 和也", status: "退勤済", totalAttendance: 185, avgWorkTime: "6時間25分", attendanceRate: "77%" },
      { name: "藤田 一郎", status: "退勤済", totalAttendance: 170, avgWorkTime: "5時間40分", attendanceRate: "71%" },
      { name: "中島 健太郎", status: "退勤済", totalAttendance: 190, avgWorkTime: "6時間10分", attendanceRate: "79%" },
      { name: "岡田 隆", status: "退勤済", totalAttendance: 145, avgWorkTime: "5時間55分", attendanceRate: "60%" },
      { name: "後藤 大介", status: "退勤済", totalAttendance: 175, avgWorkTime: "6時間45分", attendanceRate: "73%" },
      { name: "村田 翔太", status: "退勤済", totalAttendance: 160, avgWorkTime: "5時間30分", attendanceRate: "67%" },
    ],
  }

  // 選択されたデータを取得
  const teamMembers =
    timeRange === "month" ? monthlyTeamMembers[selectedMonth] || [] : yearlyTeamMembers[selectedYear] || []

  // 表示するタイトルを取得
  const displayTitle =
    timeRange === "month"
      ? `開発班メンバー詳細（${monthOptions.find((m) => m.value === selectedMonth)?.label || ""}）`
      : `開発班メンバー詳細（${selectedYear}年）`

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
