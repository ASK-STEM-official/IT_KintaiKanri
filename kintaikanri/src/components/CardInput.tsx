// src/components/CardInput.tsx
"use client";

import ErrorMessage from "./ErrorMessage";

interface Props {
  cardId: string;
  setCardId: (value: string) => void;
  error: string;
  setError: (value: string) => void;
}

export default function CardInput({ cardId, setCardId, error, setError }: Props) {
  const handleInput = (value: string) => {
    const regex = /^[A-Za-z0-9]{1,10}$/;
    if (value === "" || regex.test(value)) {
      setCardId(value);
      setError("");
    } else {
      setError("半角英数字10桁以内で入力してください（記号不可）");
    }
  };

  return (
    <div className="w-full max-w-md">
      <input
        type="text"
        value={cardId}
        onChange={(e) => handleInput(e.target.value)}
        className="text-xl p-3 border border-gray-300 rounded w-full text-center"
        placeholder="カードIDを入力..."
      />
      <ErrorMessage message={error} />
    </div>
  );
}
