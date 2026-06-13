import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-gray-600">
        Start free — 3 tasks per month, no card required.
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
