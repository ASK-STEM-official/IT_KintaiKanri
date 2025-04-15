// src/components/ErrorMessage.tsx
export default function ErrorMessage({ message }: { message: string }) {
    if (!message) return null;
    return <p className="text-red-500 mt-2 text-center">{message}</p>;
  }
  