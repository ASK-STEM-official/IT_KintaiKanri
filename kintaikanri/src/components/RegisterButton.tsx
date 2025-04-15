// src/components/RegisterButton.tsx
"use client";

export default function RegisterButton() {
  return (
    <button
      onClick={() => (window.location.href = "/register")}
      className="mt-6 px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded text-lg"
    >
      新規登録
    </button>
  );
}
