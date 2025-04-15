// src/components/NavButtons.tsx
"use client";

import { useRouter } from "next/navigation";

export default function NavButtons({ nextDisabled = false }: { nextDisabled?: boolean }) {
  const router = useRouter();

  return (
    <div className="flex justify-between mt-6">
      <button
        className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400"
        onClick={() => router.back()}
      >
        戻る
      </button>
      <button
        className="px-6 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        disabled={nextDisabled}
      >
        次へ
      </button>
    </div>
  );
}
