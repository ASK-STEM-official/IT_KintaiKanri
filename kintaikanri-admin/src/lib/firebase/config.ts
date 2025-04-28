import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// プロジェクトA（認証用）の設定
const firebaseConfigA = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_A_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_A_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_A_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_A_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_A_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_A_APP_ID,
}

// プロジェクトB（勤怠管理用）の設定
const firebaseConfigB = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_B_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_B_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_B_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_B_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_B_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_B_APP_ID,
}

// Firebaseの初期化
const appA = initializeApp(firebaseConfigA, "auth")
const appB = initializeApp(firebaseConfigB, "kintai")

// 認証とデータベースのインスタンスをエクスポート
export const auth = getAuth(appA)
export const db = getFirestore(appB) 