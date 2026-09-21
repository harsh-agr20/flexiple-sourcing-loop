"use client";

import { useEffect, useState } from "react";

export function ThinkingIndicator({ messages }: { messages: string[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % messages.length), 1400);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className="flex items-center gap-3 py-6 text-sm text-neutral-500">
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-500" />
      </span>
      {messages[idx]}
    </div>
  );
}
