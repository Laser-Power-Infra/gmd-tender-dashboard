"use server"

import { signIn, auth } from "@/auth"
import { AuthError, CredentialsSignin } from "next-auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { withLog } from "@/lib/activity-logger"

export type LoginState =
  | { url: string; email: string }
  | { error: { code: string; message: string; field?: "email" | "password" }; email: string }

const MESSAGES: Record<string, { message: string; field?: "email" | "password" }> = {
  invalid_credentials: { message: "Invalid email or password." },
  missing_fields: { message: "Enter your email and password." },
  no_password: {
    message: "This account has no password set. Ask an admin to reset it.",
    field: "password",
  },
}

export async function authenticate(
  _prev: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const redirectTo = String(formData.get("redirectTo") || "/")

  try {
    // Credentials failures are thrown (not returned) here: next-auth passes `raw`
    // without the X-Auth-Return-Redirect header, so Auth.js rethrows the AuthError.
    const url = await signIn("credentials", { email, password, redirectTo, redirect: false })
    return { url: typeof url === "string" ? url : redirectTo, email }
  } catch (error) {
    const code =
      error instanceof CredentialsSignin
        ? error.code
        : error instanceof AuthError
          ? error.type
          : "unknown"
    console.error("[login] auth failed", code, error)
    return {
      error: {
        code,
        ...(MESSAGES[code] ?? { message: "Couldn't sign in right now. Please try again." }),
      },
      email,
    }
  }
}

export const changePassword = withLog(
  async (params: { oldPassword: string; newPassword: string }) => {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized: Please sign in again")
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      throw new Error("User not found")
    }

    if (!user.passwordHash) {
      throw new Error("No password set for this account")
    }

    const isValid = await bcrypt.compare(params.oldPassword, user.passwordHash)
    if (!isValid) {
      throw new Error("Incorrect old password")
    }

    if (!params.newPassword || params.newPassword.length === 0) {
      throw new Error("New password is required")
    }

    const passwordHash = await bcrypt.hash(params.newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    return { success: true, userId: user.id }
  },
  (result) => ({
    action: "UPDATE" as const,
    tableName: "User",
    recordId: result.userId,
    details: "User changed password",
  })
)
