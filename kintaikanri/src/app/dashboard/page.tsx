"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { collection, query, where, getDocs, addDoc, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");
  const [showGreeting, setShowGreeting] = useState<boolean>(false);
  const [buffer, setBuffer] = useState<string>("");

  // 時刻更新
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const intervalId = setInterval(updateTime, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // ページ全体でキー入力を受け付ける
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (buffer.length > 0) {
          handleAttendance(buffer);
          setBuffer("");
        }
        return;
      }

      if (/^[a-zA-Z0-9]$/.test(e.key) && buffer.length < 24) {
        setBuffer((prev) => prev + e.key);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [buffer]);

  // 出退勤処理
  const handleAttendance = async (cardId: string) => {
    try {
      // `users` コレクションから該当するユーザーを取得
      const userQuery = query(collection(db, "users"), where("cardId", "==", cardId));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        setGreeting("カードIDが登録されていません");
        setShowGreeting(true);
        setTimeout(() => setShowGreeting(false), 3000);
        return;
      }

      const user = userSnapshot.docs[0].data();
      const uid = user.uid;

      // `attendance_logs` コレクションから直近のログを取得
      const attendanceQuery = query(
        collection(db, "attendance_logs"),
        where("uid", "==", uid),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);

      let newLogType: "entry" | "exit";

      if (attendanceSnapshot.empty || attendanceSnapshot.docs[0].data().type === "exit") {
        // 直近が退勤またはログがない場合 → 出勤
        newLogType = "entry";
        setGreeting(`${user.lastname} さん、いってらっしゃい`);
      } else {
        // 直近が出勤の場合 → 退勤
        newLogType = "exit";
        setGreeting(`${user.lastname} さん、お疲れ様でした`);
      }

      // 新しい出退勤ログを追加
      await addDoc(collection(db, "attendance_logs"), {
        uid,
        cardId,
        type: newLogType,
        timestamp: new Date(),
      });

      setShowGreeting(true);
      setTimeout(() => setShowGreeting(false), 3000);
    } catch (error) {
      console.error("出退勤処理エラー:", error);
      setGreeting("エラーが発生しました");
      setShowGreeting(true);
      setTimeout(() => setShowGreeting(false), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4 text-center">
        <h2 className="text-2xl font-bold">STEM研究部</h2>
        <h1 className="text-6xl font-bold">{currentTime}</h1>

        {showGreeting && (
          <h3 className="text-xl font-medium text-green-600">{greeting}</h3>
        )}

        <h3 className="text-xl font-medium">NFC/RFIDカードをタッチしてください</h3>

        {/* 入力中のカードID表示（任意） */}
        {buffer && (
          <p className="text-md text-blue-600 font-mono">
            入力中: {buffer}
          </p>
        )}

        {/* 新規登録 */}
        <Link href="/register">
          <Button size="lg">新規登録</Button>
        </Link>
      </div>
    </div>
  );
}
