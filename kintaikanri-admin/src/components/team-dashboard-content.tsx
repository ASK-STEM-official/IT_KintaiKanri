"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UsersIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"

interface AttendanceLog {
  id: string
  userId: string
  type: "entry" | "exit"
  timestamp: Date
  userName: string
}

export function TeamDashboardContent({ teamId }: { teamId: string }) {
  const [workingMembers, setWorkingMembers] = useState(0)
  const [totalMembers, setTotalMembers] = useState(0)
  const [todayAttendanceRate, setTodayAttendanceRate] = useState("0%")
  const [todayAvgWorkTime, setTodayAvgWorkTime] = useState("0時間0分")
  const [selectedTeam, setSelectedTeam] = useState<string>(teamId)
  const [teams, setTeams] = useState<{ id: string, name: string }[]>([])

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
  }, [selectedYear, selectedMonth, selectedDay])

  const [selectedDateAttendance, setSelectedDateAttendance] = useState<{
    name: string
    entryTime: string
    exitTime: string
    workTime: string
  }[]>([])

  const [isLoading, setIsLoading] = useState(true)

  // Firestoreからデータを取得
  useEffect(() => {
    const fetchTeamData = async () => {
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

        // 班が選択されていない場合は最初の班を選択
        if (!selectedTeam && teamsList.length > 0) {
          setSelectedTeam(teamsList[0].id)
        }

        if (!selectedTeam) return

        // 選択された班のメンバー数を取得
        const usersRef = collection(db, "users")
        const usersQuery = query(usersRef, where("teamId", "==", selectedTeam))
        const usersSnapshot = await getDocs(usersQuery)
        const totalCount = usersSnapshot.size
        setTotalMembers(totalCount)

        // メンバーIDのリストを取得
        const memberIds = usersSnapshot.docs.map(doc => doc.id)
        if (memberIds.length === 0) {
          setWorkingMembers(0)
          setTodayAttendanceRate("0%")
          setTodayAvgWorkTime("0時間0分")
          setSelectedDateAttendance([])
          setIsLoading(false)
          return
        }

        // 今日の日付を取得（日本時間）
        const currentDate = new Date()
        const jstNow = new Date(currentDate.getTime() + (9 * 60 * 60 * 1000))
        const today = jstNow.toISOString().split('T')[0]
        const todayStart = new Date(today)
        const todayEnd = new Date(today)
        todayEnd.setDate(todayEnd.getDate() + 1)

        // 今日の出勤ログを取得
        const logsRef = collection(db, "attendance_logs")
        const logsQuery = query(
          logsRef,
          where("uid", "in", memberIds),
          where("timestamp", ">=", Timestamp.fromDate(todayStart)),
          where("timestamp", "<", Timestamp.fromDate(todayEnd))
        )
        const logsSnapshot = await getDocs(logsQuery)

        // ユーザーごとの出退勤ログを整理
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

        // 出勤したユーザーのユニーク数をカウント
        const attendedUsers = new Set<string>()
        userLogs.forEach((logs, userId) => {
          if (logs.entries.length > 0) {
            attendedUsers.add(userId)
          }
        })

        // 出勤率を計算
        const attendanceRate = totalCount > 0
          ? Math.round((attendedUsers.size / totalCount) * 100)
          : 0
        setTodayAttendanceRate(`${attendanceRate}%`)

        // 平均勤務時間を計算
        let totalWorkTime = 0
        let validWorkDays = 0
        userLogs.forEach((logs) => {
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
        })

        // 平均勤務時間を計算して表示形式に変換
        const avgWorkTimeMs = validWorkDays > 0 ? totalWorkTime / validWorkDays : 0
        const avgWorkHours = Math.floor(avgWorkTimeMs / (1000 * 60 * 60))
        const avgWorkMinutes = Math.floor((avgWorkTimeMs % (1000 * 60 * 60)) / (1000 * 60))
        const avgWorkTime = validWorkDays > 0
          ? `${avgWorkHours}時間${avgWorkMinutes}分`
          : "0時間0分"
        setTodayAvgWorkTime(avgWorkTime)

        // 勤務中のメンバーを取得
        const currentTimestamp = Timestamp.now()
        const workingLogsQuery = query(
          logsRef,
          where("uid", "in", memberIds),
          where("timestamp", ">=", new Timestamp(currentTimestamp.seconds - 24 * 60 * 60, 0))
        )
        const workingLogsSnapshot = await getDocs(workingLogsQuery)

        // ユーザーごとの最新の出退勤状態を確認
        const userStatus = new Map<string, { lastEntry?: Timestamp, lastExit?: Timestamp }>()
        workingLogsSnapshot.docs.forEach(doc => {
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

        // 選択された日付の出退勤履歴を取得
        const selectedDate = new Date(Number.parseInt(selectedYear), Number.parseInt(selectedMonth) - 1, Number.parseInt(selectedDay))
        const selectedDateStart = new Date(selectedDate)
        const selectedDateEnd = new Date(selectedDate)
        selectedDateEnd.setDate(selectedDateEnd.getDate() + 1)

        const dailyLogsQuery = query(
          logsRef,
          where("uid", "in", memberIds),
          where("timestamp", ">=", Timestamp.fromDate(selectedDateStart)),
          where("timestamp", "<", Timestamp.fromDate(selectedDateEnd))
        )
        const dailyLogsSnapshot = await getDocs(dailyLogsQuery)

        // ユーザーごとの出退勤ログを整理
        const dailyUserLogs = new Map<string, { name: string, entries: Timestamp[], exits: Timestamp[] }>()
        dailyLogsSnapshot.docs.forEach(doc => {
          const log = doc.data()
          if (!dailyUserLogs.has(log.uid)) {
            // ユーザー情報を取得
            const userDoc = usersSnapshot.docs.find(d => d.id === log.uid)
            const userData = userDoc?.data()
            const name = userData ? `${userData.lastname} ${userData.firstname}` : "不明"
            dailyUserLogs.set(log.uid, { name, entries: [], exits: [] })
          }
          if (log.type === "entry") {
            dailyUserLogs.get(log.uid)?.entries.push(log.timestamp)
          } else {
            dailyUserLogs.get(log.uid)?.exits.push(log.timestamp)
          }
        })

        // 出退勤履歴を生成
        const attendanceHistory = Array.from(dailyUserLogs.entries()).map(([_, logs]) => {
          const entryTime = logs.entries[0]?.toDate().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) || "-"
          const exitTime = logs.exits[0]?.toDate().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) || "-"
          
          let workTime = "-"
          if (logs.entries[0] && logs.exits[0]) {
            const workTimeMs = logs.exits[0].toDate().getTime() - logs.entries[0].toDate().getTime()
            if (workTimeMs >= 60 * 1000) {
              const hours = Math.floor(workTimeMs / (1000 * 60 * 60))
              const minutes = Math.floor((workTimeMs % (1000 * 60 * 60)) / (1000 * 60))
              workTime = `${hours}:${minutes.toString().padStart(2, '0')}`
            }
          }

          return {
            name: logs.name,
            entryTime,
            exitTime,
            workTime
          }
        })

        // 名前でソート
        attendanceHistory.sort((a, b) => a.name.localeCompare(b.name, 'ja'))
        setSelectedDateAttendance(attendanceHistory)

      } catch (error) {
        console.error("班データの取得に失敗しました:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeamData()
  }, [selectedYear, selectedMonth, selectedDay, selectedTeam])

  // 表示用の日付フォーマット
  const displayDate = `${selectedYear}年${Number.parseInt(selectedMonth)}月${Number.parseInt(selectedDay)}日`

  if (isLoading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* 班情報と統計情報を横並びに */}
      <div className="grid grid-cols-1 gap-3">
        {/* 班別概要 - 日次情報 */}
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                {teams.find(t => t.id === selectedTeam)?.name || "班"}の概要
              </CardTitle>
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
                <span>{todayAttendanceRate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">今日の平均勤務時間:</span>
                <span>{todayAvgWorkTime}</span>
              </div>
            </div>
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
                <SelectTrigger className="h-7 text-sm w-[80px]">
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
                  ? `${selectedDateAttendance.filter(m => m.entryTime !== "-").length}/${selectedDateAttendance.length}人出勤`
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
                  selectedDateAttendance.map((member, index) => (
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
