"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UsersIcon, BarChart3Icon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from "firebase/firestore"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AttendanceLog {
  id: string
  userId: string
  type: "entry" | "exit"
  timestamp: Date
  userName: string
}

export function TeamDashboardContent({ teamId }: { teamId: string }) {
  const [timeRange, setTimeRange] = useState("month")
  const [workingMembers, setWorkingMembers] = useState(0)
  const [totalMembers, setTotalMembers] = useState(0)
  const [todayAttendanceRate, setTodayAttendanceRate] = useState("0%")
  const [todayAvgWorkTime, setTodayAvgWorkTime] = useState("0時間0分")
  const [monthlyStats, setMonthlyStats] = useState({
    avgAttendance: "0人",
    attendanceRate: "0%",
    avgWorkTime: "0時間0分"
  })
  const [yearlyStats, setYearlyStats] = useState({
    avgAttendance: "0人",
    attendanceRate: "0%",
    avgWorkTime: "0時間0分"
  })
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

  const [selectedDateAttendance, setSelectedDateAttendance] = useState<{
    name: string
    entryTime: string
    exitTime: string
    workTime: string
  }[]>([])

  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Firestoreからデータを取得
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
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
          where("teamId", "==", selectedTeam),
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
        userLogs.forEach((logs, uid) => {
          if (logs.entries.length > 0) {
            attendedUsers.add(uid)
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
          where("teamId", "==", selectedTeam),
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

        // 月次統計情報の取得
        const monthlySummaryRef = collection(db, "summary")
        const monthlySummaryQuery = query(
          monthlySummaryRef,
          where("year", "==", Number.parseInt(selectedYear)),
          where("month", "==", Number.parseInt(selectedMonth))
        )
        const monthlySummarySnapshot = await getDocs(monthlySummaryQuery)
        
        if (!monthlySummarySnapshot.empty) {
          const monthlyData = monthlySummarySnapshot.docs[0].data()
          const workDays = monthlyData.workdays || 0
          
          // 月次の出勤ログを取得
          const startOfMonth = new Date(Number.parseInt(selectedYear), Number.parseInt(selectedMonth) - 1, 1)
          const endOfMonth = new Date(Number.parseInt(selectedYear), Number.parseInt(selectedMonth), 0)
          
          const monthlyLogsQuery = query(
            logsRef,
            where("teamId", "==", selectedTeam),
            where("timestamp", ">=", Timestamp.fromDate(startOfMonth)),
            where("timestamp", "<=", Timestamp.fromDate(endOfMonth))
          )
          const monthlyLogsSnapshot = await getDocs(monthlyLogsQuery)

          // 月次の統計を計算
          const monthlyUserLogs = new Map<string, { uid: string, entries: Timestamp[], exits: Timestamp[] }>()
          monthlyLogsSnapshot.docs.forEach(doc => {
            const log = doc.data()
            if (!monthlyUserLogs.has(log.uid)) {
              monthlyUserLogs.set(log.uid, { uid: log.uid, entries: [], exits: [] })
            }
            if (log.type === "entry") {
              monthlyUserLogs.get(log.uid)?.entries.push(log.timestamp)
            } else {
              monthlyUserLogs.get(log.uid)?.exits.push(log.timestamp)
            }
          })

          // 月次の平均出勤人数と出勤率を計算
          const monthlyAttendedUsers = new Set<string>()
          let monthlyTotalWorkTime = 0
          let monthlyValidWorkDays = 0

          monthlyUserLogs.forEach((logs) => {
            if (logs.entries.length > 0) {
              monthlyAttendedUsers.add(logs.uid)
            }
            logs.entries.forEach((entry, index) => {
              const exit = logs.exits[index]
              if (exit) {
                const workTime = exit.toDate().getTime() - entry.toDate().getTime()
                if (workTime >= 60 * 1000) {
                  monthlyTotalWorkTime += workTime
                  monthlyValidWorkDays++
                }
              }
            })
          })

          const monthlyAvgAttendance = Math.round(monthlyAttendedUsers.size / workDays)
          const monthlyAttendanceRate = totalCount > 0
            ? Math.round((monthlyAttendedUsers.size / (totalCount * workDays)) * 100)
            : 0

          const monthlyAvgWorkTimeMs = monthlyValidWorkDays > 0 ? monthlyTotalWorkTime / monthlyValidWorkDays : 0
          const monthlyAvgWorkHours = Math.floor(monthlyAvgWorkTimeMs / (1000 * 60 * 60))
          const monthlyAvgWorkMinutes = Math.floor((monthlyAvgWorkTimeMs % (1000 * 60 * 60)) / (1000 * 60))

          setMonthlyStats({
            avgAttendance: `${monthlyAvgAttendance}人`,
            attendanceRate: `${monthlyAttendanceRate}%`,
            avgWorkTime: `${monthlyAvgWorkHours}時間${monthlyAvgWorkMinutes}分`
          })
        }

        // 年次統計情報の取得
        const yearlySummaryQuery = query(
          monthlySummaryRef,
          where("year", "==", Number.parseInt(selectedYear))
        )
        const yearlySummarySnapshot = await getDocs(yearlySummaryQuery)
        
        if (!yearlySummarySnapshot.empty) {
          // 年間の労働日数を計算
          let totalWorkDays = 0
          yearlySummarySnapshot.docs.forEach(doc => {
            const data = doc.data()
            totalWorkDays += data.workdays || 0
          })

          // 年次の出勤ログを取得
          const startOfYear = new Date(Number.parseInt(selectedYear), 0, 1)
          const endOfYear = new Date(Number.parseInt(selectedYear), 11, 31)
          
          const yearlyLogsQuery = query(
            logsRef,
            where("teamId", "==", selectedTeam),
            where("timestamp", ">=", Timestamp.fromDate(startOfYear)),
            where("timestamp", "<=", Timestamp.fromDate(endOfYear))
          )
          const yearlyLogsSnapshot = await getDocs(yearlyLogsQuery)

          // 年次の統計を計算
          const yearlyUserLogs = new Map<string, { uid: string, entries: Timestamp[], exits: Timestamp[] }>()
          yearlyLogsSnapshot.docs.forEach(doc => {
            const log = doc.data()
            if (!yearlyUserLogs.has(log.uid)) {
              yearlyUserLogs.set(log.uid, { uid: log.uid, entries: [], exits: [] })
            }
            if (log.type === "entry") {
              yearlyUserLogs.get(log.uid)?.entries.push(log.timestamp)
            } else {
              yearlyUserLogs.get(log.uid)?.exits.push(log.timestamp)
            }
          })

          // 年次の平均出勤人数と出勤率を計算
          const yearlyAttendedUsers = new Set<string>()
          let yearlyTotalWorkTime = 0
          let yearlyValidWorkDays = 0

          yearlyUserLogs.forEach((logs) => {
            if (logs.entries.length > 0) {
              yearlyAttendedUsers.add(logs.uid)
            }
            logs.entries.forEach((entry, index) => {
              const exit = logs.exits[index]
              if (exit) {
                const workTime = exit.toDate().getTime() - entry.toDate().getTime()
                if (workTime >= 60 * 1000) {
                  yearlyTotalWorkTime += workTime
                  yearlyValidWorkDays++
                }
              }
            })
          })

          const yearlyAvgAttendance = Math.round(yearlyAttendedUsers.size / totalWorkDays)
          const yearlyAttendanceRate = totalCount > 0
            ? Math.round((yearlyAttendedUsers.size / (totalCount * totalWorkDays)) * 100)
            : 0

          const yearlyAvgWorkTimeMs = yearlyValidWorkDays > 0 ? yearlyTotalWorkTime / yearlyValidWorkDays : 0
          const yearlyAvgWorkHours = Math.floor(yearlyAvgWorkTimeMs / (1000 * 60 * 60))
          const yearlyAvgWorkMinutes = Math.floor((yearlyAvgWorkTimeMs % (1000 * 60 * 60)) / (1000 * 60))

          setYearlyStats({
            avgAttendance: `${yearlyAvgAttendance}人`,
            attendanceRate: `${yearlyAttendanceRate}%`,
            avgWorkTime: `${yearlyAvgWorkHours}時間${yearlyAvgWorkMinutes}分`
          })
        }

        // 選択された日付の出退勤履歴を取得
        const selectedDate = new Date(Number.parseInt(selectedYear), Number.parseInt(selectedMonth) - 1, Number.parseInt(selectedDay))
        const selectedDateStart = new Date(selectedDate)
        const selectedDateEnd = new Date(selectedDate)
        selectedDateEnd.setDate(selectedDateEnd.getDate() + 1)

        const dailyLogsQuery = query(
          logsRef,
          where("teamId", "==", selectedTeam),
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

        // 出退勤ログの取得
        const fetchAttendanceLogs = async () => {
          try {
            // 班のメンバーを取得
            const teamDoc = await getDoc(doc(db, "teams", teamId))
            if (!teamDoc.exists()) return

            const teamData = teamDoc.data()
            const memberIds = teamData.memberIds || []

            // 今日の出退勤ログを取得
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            const logsRef = collection(db, "attendance_logs")
            const q = query(
              logsRef,
              where("userId", "in", memberIds),
              where("timestamp", ">=", today),
              where("timestamp", "<", tomorrow)
            )

            const logsSnapshot = await getDocs(q)
            const logs: AttendanceLog[] = []

            // ユーザー情報を取得してログに追加
            for (const logDoc of logsSnapshot.docs) {
              const logData = logDoc.data()
              const userDoc = await getDoc(doc(db, "users", logData.userId))
              const userName = userDoc.exists() ? userDoc.data().name : "不明"

              logs.push({
                id: logDoc.id,
                userId: logData.userId,
                type: logData.type,
                timestamp: logData.timestamp.toDate(),
                userName
              })
            }

            // タイムスタンプでソート
            logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            setAttendanceLogs(logs)
          } catch (error) {
            console.error("出退勤ログの取得に失敗しました:", error)
          } finally {
            setIsLoading(false)
          }
        }

        fetchAttendanceLogs()

      } catch (error) {
        console.error("班データの取得に失敗しました:", error)
      }
    }

    fetchTeamData()
  }, [selectedYear, selectedMonth, selectedDay, selectedTeam])

  // ダミーデータ - 班情報
  const teamData = {
    name: "開発班",
    totalMembers: 24,
    workingMembers: 14,
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

  // 表示用の日付フォーマット
  const displayDate = `${selectedYear}年${Number.parseInt(selectedMonth)}月${Number.parseInt(selectedDay)}日`

  if (isLoading) {
    return <div>読み込み中...</div>
  }

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* 班情報と統計情報を横並びに */}
      <div className="grid grid-cols-2 gap-3">
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
                    {timeRange === "month" ? monthlyStats.avgAttendance : yearlyStats.avgAttendance}
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 bg-muted rounded-md">
                  <span className="text-xs text-muted-foreground mb-1">出勤率</span>
                  <span className="text-lg font-semibold">
                    {timeRange === "month" ? monthlyStats.attendanceRate : yearlyStats.attendanceRate}
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 bg-muted rounded-md">
                  <span className="text-xs text-muted-foreground mb-1">平均勤務時間</span>
                  <span className="text-lg font-semibold">
                    {timeRange === "month" ? monthlyStats.avgWorkTime : yearlyStats.avgWorkTime}
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

      <Card className="shadow-sm flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-2 px-4 bg-white z-10 flex-shrink-0">
          <CardTitle className="text-base font-medium">今日の出退勤ログ</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {attendanceLogs.length === 0 ? (
                <p className="text-center text-muted-foreground">出退勤ログがありません</p>
              ) : (
                attendanceLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{log.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-sm ${
                        log.type === "entry"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.type === "entry" ? "出勤" : "退勤"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
