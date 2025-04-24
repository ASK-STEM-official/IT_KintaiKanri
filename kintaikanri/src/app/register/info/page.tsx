"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { auth } from "@/lib/firebase/config"
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export default function RegisterInfo() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: ""
  })

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/auth")
        return
      }

      setCurrentUser(user)
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
      } catch (err) {
        setError("ユーザー情報の取得に失敗しました")
        console.error(err)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    try {
      setIsLoading(true)
      setError("")

      // ユーザー情報を保存
      await setDoc(doc(db, "users", currentUser.uid), {
        uid: currentUser.uid,
        github: userInfo.github,
        firstname: formData.firstname,
        lastname: formData.lastname,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      router.push("/register/card")
    } catch (err) {
      setError("情報の保存に失敗しました")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!userInfo || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold">情報登録</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
          {error && (
            <p className="text-red-500 mb-4">{error}</p>
          )}

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
                value={formData.lastname}
                onChange={(e) => setFormData(prev => ({ ...prev, lastname: e.target.value }))}
                required
              />
            </div>

            <div>
              <label htmlFor="firstname" className="block text-gray-500 mb-1">
                名
              </label>
              <Input
                id="firstname"
                value={formData.firstname}
                onChange={(e) => setFormData(prev => ({ ...prev, firstname: e.target.value }))}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6"
          >
            {isLoading ? "処理中..." : "次へ"}
          </Button>
        </form>
      </div>
    </div>
  )
} 