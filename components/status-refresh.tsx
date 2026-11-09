"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function StatusRefresh() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          router.refresh();
          return 30;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <button
      type="button"
      className="button button-ghost button-small"
      disabled={refreshing}
      onClick={() => {
        setRefreshing(true);
        router.refresh();
        window.setTimeout(() => {
          setRefreshing(false);
          setSeconds(30);
        }, 600);
      }}
    >
      <RefreshCw size={14} className={refreshing ? "spin" : ""} />
      Refresh · {seconds}s
    </button>
  );
}
