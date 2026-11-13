"use client";

import { useEffect, useState } from "react";
import { POLL_SECONDS } from "@/lib/use-live-quotes";

function formatAge(seconds: number) {
  if (seconds < 2) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s ago`;
}

export function UpdatedAgo({
  at,
  className = "text-[12px] text-faint",
}: {
  at: number | null;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    const first = window.setTimeout(tick, 0);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(first);
    };
  }, []);

  if (!at) {
    return (
      <span className={className} role="status">
        Waiting for the first quote…
      </span>
    );
  }

  const seconds = now === null ? 0 : Math.max(0, Math.round((now - at) / 1000));

  return (
    <span
      className={className}
      role="status"
      title={`Last refreshed at ${new Date(at).toLocaleTimeString("en-US")}`}
    >
      Updated {formatAge(seconds)}
      <span className="hidden sm:inline">
        {" "}
        · refreshes every {POLL_SECONDS}s
      </span>
    </span>
  );
}
