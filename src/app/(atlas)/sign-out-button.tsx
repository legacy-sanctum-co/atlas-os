"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/core/auth/client";
import { Button } from "@/design/primitives/button";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onSignOut}
      loading={pending}
      aria-label="Sign out"
      className={compact ? "size-11 px-0" : "w-11 px-0"}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
        <path d="m15 8 4 4-4 4M19 12H9" />
      </svg>
    </Button>
  );
}
