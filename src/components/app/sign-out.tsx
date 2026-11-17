"use client";

import { signOutAction } from "@/server/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="w-full rounded-full px-3 py-1.5 text-left text-sm text-muted transition-colors hover:bg-gray-100 hover:text-ink"
      >
        Sign out
      </button>
    </form>
  );
}
