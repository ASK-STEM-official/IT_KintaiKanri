# Firestore データベース構造

## コレクション一覧

### 1. users
ユーザー情報を管理するコレクション

**パス**: `users/{uid}`

| フィールド | 型 | 説明 |
|------------|------|------------|
| uid | string | Firebase AuthのUID（ドキュメントID） |
| github | string | GitHubアカウント名 |
| cardId | string | NFC/RFIDカードID |
| firstname | string | 名 |
| lastname | string | 姓 |
| teamId | string | 所属班のID |
| grade | number | 期生（例：1期生、2期生） |
| createdAt | Timestamp | 登録日時 |

### 2. attendance_logs
出退勤記録を管理するコレクション

**パス**: `attendance_logs/{logId}`

| フィールド | 型 | 説明 |
|------------|------|------------|
| uid | string | 出退勤したユーザーのUID |
| cardId | string | 使用したカードID |
| type | string | "entry"（出勤）または"exit"（退勤） |
| timestamp | Timestamp | 打刻時刻 |

### 3. link_requests
スマートフォンとRaspberry Piの連携用コレクション

**パス**: `link_requests/{requestId}`

| フィールド | 型 | 説明 |
|------------|------|------------|
| token | string | 一時トークン（UUID） |
| status | string | "waiting"（待機中）、"linked"（連携済み）、"done"（完了） |
| uid | string | ログイン済みユーザーのUID（連携後に設定） |
| createdAt | Timestamp | 作成時刻 |
| updatedAt | Timestamp | 更新時刻 |

### 4. teams
班情報を管理するコレクション

**パス**: `teams/{teamId}`

| フィールド | 型 | 説明 |
|------------|------|------------|
| name | string | 班名 |
| createdAt | Timestamp | 作成時刻 |

### 5. workdays
労働日数を管理するコレクション

**パス**: `workdays/{date}`

| フィールド | 型 | 説明 |
|------------|------|------------|
| date | string | 日付（YYYY-MM-DD形式） |
| createdAt | Timestamp | 作成時刻 |

### 6. summary
月次サマリーを管理するコレクション

**パス**: `summary/workdays_{YYYY_MM}`

| フィールド | 型 | 説明 |
|------------|------|------------|
| totalDays | number | 月間の総労働日数 |
| updatedAt | Timestamp | 更新時刻 |

## インデックス

以下のフィールドにインデックスが必要です：

1. `attendance_logs`コレクション
   - `uid` + `timestamp`（降順）

## セキュリティルール

各コレクションのアクセス制御は以下のように設定されています：

- `users`: 認証済みユーザーのみ読み取り可能
- `attendance_logs`: 認証済みユーザーのみ読み取り可能
- `link_requests`: 未認証ユーザーでも作成可能、認証済みユーザーは読み取り可能
- `teams`: 認証済みユーザーのみ読み取り可能
- `workdays`: 認証済みユーザーのみ読み取り可能
- `summary`: 認証済みユーザーのみ読み取り可能
