import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-gray-600">
        Sign in to your TaskFlow workspace.
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-gray-600">
        New here?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
