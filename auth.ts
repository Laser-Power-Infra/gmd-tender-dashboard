import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// CredentialsSignin hardcodes code="credentials" after super(), so set it after constructing.
function coded(code: string) {
  const err = new CredentialsSignin()
  err.code = code
  return err
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase()
        const password = String(credentials?.password ?? "")

        if (!email || !password) throw coded("missing_fields")

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) throw coded("invalid_credentials")
        if (!user.passwordHash) throw coded("no_password")
        if (!(await bcrypt.compare(password, user.passwordHash))) throw coded("invalid_credentials")

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  trustHost: true,
})
