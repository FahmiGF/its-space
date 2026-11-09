"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";

export function LogoutButton({
  withLabel = false,
  className,
}: {
  withLabel?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      className={className ?? "icon-button"}
      aria-label="Keluar dari akun"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/");
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? <LoaderCircle size={17} className="spin" /> : <LogOut size={17} />}
      {withLabel && <span>Keluar</span>}
    </button>
  );
}
