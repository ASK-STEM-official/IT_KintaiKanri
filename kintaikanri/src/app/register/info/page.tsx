"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { auth } from "@/lib/firebase/config"
import { db } from "@/lib/firebase/config"
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "firebase/firestore"

type Team = {
  id: string
  name: string
}

type UserInfo = {
  uid: string
  github: string
}

export default function RegisterInfoPage() {
  const router = useRouter()
  const [user, setUser] = useState(auth.currentUser)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [firstname, setFirstname] = useState("")
  const [lastname, setLastname] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("")
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user)
      if (!user) {
        router.push("/auth")
        return
      }

      try {
        // link_requestsからユーザー情報を取得
        const q = query(collection(db, "link_requests"), where("uid", "==", user.uid))
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data()
          setUserInfo({
            uid: data.uid,
            github: data.github
          })
        }
      } catch (error) {
        console.error("ユーザー情報の取得に失敗しました:", error)
      }
    })
    return () => unsubscribe()
  }, [router])

  // 班一覧を取得
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsRef = collection(db, "teams")
        const teamsSnapshot = await getDocs(teamsRef)
        const teamsList = teamsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }))
        setTeams(teamsList)
      } catch (error) {
        console.error("班一覧の取得に失敗しました:", error)
      }
    }

    fetchTeams()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      // ユーザー情報を保存
      const userRef = doc(db, "users", user.uid)
      await setDoc(userRef, {
        firstname,
        lastname,
        teamId: selectedTeam,
        createdAt: new Date(),
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("ユーザー情報の保存に失敗しました:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || !userInfo) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold">情報登録</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-4">
            <div>
              <p className="text-gray-500">UID</p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                {userInfo.uid}
              </p>
            </div>

            <div>
              <p className="text-gray-500">GitHub名</p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                {userInfo.github}
              </p>
            </div>

            <div>
              <label htmlFor="lastname" className="block text-gray-500 mb-1">
                姓
              </label>
              <Input
                id="lastname"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                required
                placeholder="山田"
              />
            </div>

            <div>
              <label htmlFor="firstname" className="block text-gray-500 mb-1">
                名
              </label>
              <Input
                id="firstname"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                required
                placeholder="太郎"
              />
            </div>

            <div>
              <label htmlFor="team" className="block text-gray-500 mb-1">
                班
              </label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam} required>
                <SelectTrigger id="team">
                  <SelectValue placeholder="班を選択" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6"
          >
            {isLoading ? "処理中..." : "登録"}
          </Button>
        </form>
      </div>
    </div>
  )
} 