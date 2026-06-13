"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { registerUser } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerUser, undefined);
  const [accountType, setAccountType] = useState<"individual" | "organization">(
    "individual",
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">Full name</label>
        <input id="name" name="name" required className="input" placeholder="Ada Lovelace" />
      </div>
      <div>
        <label className="label" htmlFor="email">Work email</label>
        <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={8} className="input" placeholder="At least 8 characters" />
      </div>

      <div>
        <span className="label">Account type</span>
        <div className="grid grid-cols-2 gap-2">
          {(["individual", "organization"] as const).map((t) => (
            <label
              key={t}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm capitalize ${
                accountType === t
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              <input
                type="radio"
                name="accountType"
                value={t}
                checked={accountType === t}
                onChange={() => setAccountType(t)}
                className="sr-only"
              />
              {t}
            </label>
          ))}
        </div>
      </div>

      {accountType === "organization" && (
        <div>
          <label className="label" htmlFor="orgName">Organization name</label>
          <input id="orgName" name="orgName" className="input" placeholder="Acme Inc." />
          <p className="mt-1 text-xs text-gray-500">
            You&apos;ll be the owner and can invite teammates later.
          </p>
        </div>
      )}

      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input type="checkbox" name="asTasker" className="mt-0.5" />
        <span>
          I also want to <strong>work as a tasker</strong> (creates a tasker
          profile so you can be assigned work).
        </span>
      </label>

      {state?.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
