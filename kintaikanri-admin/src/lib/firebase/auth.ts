import { auth, db } from "./config"
import { 
  onAuthStateChanged,
  signInWithPopup,
  GithubAuthProvider,
  User
} from "firebase/auth"
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  addDoc
} from "firebase/firestore"

// 認証状態の監視
export const watchAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

// GitHubログイン
export const signInWithGitHub = async () => {
  const provider = new GithubAuthProvider()
  try {
    const result = await signInWithPopup(auth, provider)
    return result.user
  } catch (error) {
    console.error("GitHubログインエラー:", error)
    throw error
  }
}

// トークンの保存
export const saveToken = async (token: string) => {
  try {
    // 未認証ユーザーでも保存できるように、addDocを使用
    await addDoc(collection(db, "link_requests"), {
      token,
      status: "waiting",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error("トークン保存エラー:", error)
    throw error
  }
}

// トークンの状態監視
export const watchTokenStatus = (token: string, callback: (status: string, data?: { uid?: string, github?: string }) => void) => {
  return onSnapshot(
    collection(db, "link_requests"),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data()
        if (data.token === token) {
          callback(data.status, data)
        }
      })
    },
    (error) => {
      console.error("トークン状態監視エラー:", error)
    }
  )
}

// ユーザー情報の取得
export const getUserInfo = async (uid: string) => {
  try {
    const docRef = doc(db, "users", uid)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data()
    }
    return null
  } catch (error) {
    console.error("ユーザー情報取得エラー:", error)
    throw error
  }
}

// ログアウト
export const signOut = async () => {
  try {
    await auth.signOut()
  } catch (error) {
    console.error("ログアウトエラー:", error)
    throw error
  }
}