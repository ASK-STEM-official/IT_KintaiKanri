"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signInWithGitHub } from "@/lib/firebase/auth";

export default function Login() {
  const router = useRouter();

  const handleGitHubLogin = async () => {
    try {
      const user = await signInWithGitHub();
      if (user) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("GitHubログインエラー:", error);
      alert("ログインに失敗しました。再試行してください。");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold">ログイン</h1>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="mb-4">GitHubアカウントでログインしてください</p>
          <Button onClick={handleGitHubLogin} className="w-full">
            GitHubでログイン
          </Button>
        </div>
      </div>
    </div>
  );
}