"use client";

import { signOutAction } from "@/server/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      >
        Sign out
      </button>
    </form>
  );
}
