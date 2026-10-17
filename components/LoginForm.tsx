"use client"

import { useActionState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { authenticate } from "@/actions/auth"
import Link from "next/link"
import { LogIn } from "lucide-react"

export default function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const [state, formAction, pending] = useActionState(authenticate, undefined)

  useEffect(() => {
    if (state && "url" in state) window.location.href = state.url
  }, [state])

  const error = state && "error" in state ? state.error : null
  const email = state?.email ?? ""
  const signupSuccess = searchParams.get("signup") === "success"

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-brand">G M DALUI</h1>
        <p className="mt-1 text-sm text-gray-500">Executive Dashboard</p>
      </div>

      {signupSuccess && (
        <div className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Account created successfully. Please sign in.
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirectTo" value={callbackUrl} />
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={email}
            aria-invalid={error?.field === "email" || undefined}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-brand ${
              error?.field === "email" ? "border-red-400" : "border-gray-300"
            }`}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            aria-invalid={error?.field === "password" || undefined}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-brand ${
              error?.field === "password" ? "border-red-400" : "border-gray-300"
            }`}
            placeholder="Enter your password"
          />
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {error.message}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            "Signing in..."
          ) : (
            <>
              <LogIn size={16} />
              Sign In
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="font-semibold text-brand hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  )
}
