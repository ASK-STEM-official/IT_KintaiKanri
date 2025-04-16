// ==============================
// Firestore データ構造（型付き）
// ==============================

// 🔹 users コレクション
// パス: users/{uid}

{
  uid: string;                     // Firebase Auth UID（ドキュメントID）
  github: string;                  // GitHubアカウント名またはID
  cardId: string;                  // NFC/RFIDカードID（例: "1234567890"）
  firstname: string;              // 名（例: "太郎"）
  lastname: string;               // 姓（例: "山田"）
  IsAdmin: true | false         // 権限（管理者 or 一般）
  createdAt: FirebaseFirestore.Timestamp; // 登録日時
}

// 🔹 attendance_logs コレクション
// パス: attendance_logs/{logId}

{
  uid: string;                     // 出退勤したユーザーのUID（users/{uid}への参照）
  type: "entry" | "exit";         // "entry" → 出勤, "exit" → 退勤
  timestamp: FirebaseFirestore.Timestamp; // 打刻時刻
}

// 🔹 link_requests コレクション（スマホとRaspiの連携用）
// パス: link_requests/{token}

{
  token: string;                  // 一時トークン（UUIDなど）
  status: "waiting" | "linked" | "done"; // 状態フラグ
  uid?: string;                   // ログイン済みのFirebase UID（linked以降で入る）
  createdAt: FirebaseFirestore.Timestamp; // 作成時刻
  updatedAt: FirebaseFirestore.Timestamp; // 更新時刻
}
