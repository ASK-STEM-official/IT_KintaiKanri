import { db } from "./firebase/config"
import { doc, setDoc, increment, getDoc } from "firebase/firestore"
import dayjs from "dayjs"

/**
 * 初回出勤の場合に労働日数を記録する関数
 * - 同じ日に複数人が出勤しても1日としてカウント
 * - 冪等性を保証（1日1カウントのみ）
 */
export async function recordWorkdayIfFirstEntry(): Promise<void> {
  try {
    // 現在の日付を取得
    const today = dayjs()
    const dateStr = today.format("YYYY-MM-DD")
    const monthStr = today.format("YYYY_MM")

    // 労働日ドキュメントの参照
    const workdayRef = doc(db, "workdays", dateStr)

    // 既に労働日として記録されているか確認
    const workdayDoc = await getDoc(workdayRef)
    if (workdayDoc.exists()) {
      // 既に記録済みの場合は何もしない
      return
    }

    // 労働日ドキュメントを新規作成
    await setDoc(workdayRef, {
      date: dateStr,
      createdAt: new Date()
    })

    // 月次サマリードキュメントの参照
    const summaryRef = doc(db, "summary", `workdays_${monthStr}`)

    // 月次サマリーを更新
    await setDoc(summaryRef, {
      totalDays: increment(1),
      updatedAt: new Date()
    }, { merge: true })

  } catch (error) {
    // 既に存在する場合はスキップ（冪等性の保証）
    if (error instanceof Error && error.message.includes("already-exists")) {
      return
    }
    // その他のエラーは上位で処理
    throw error
  }
} 