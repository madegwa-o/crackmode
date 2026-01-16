import NextAuth, { type DefaultSession } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { addOrUpdateUser, getUserByEmail } from "@/lib/users"
import { Role } from "@/lib/roles"

/* ------------------------------------
   NextAuth Type Augmentation (Enum-safe)
------------------------------------- */
declare module "next-auth" {
    interface Session {
        user: {
            id?: string | null
            roles?: Role[]
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        roles?: Role[]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        userId?: string
        roles?: Role[]
    }
}

/* ------------------------------------
   Auth Handler
------------------------------------- */
const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },

            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await getUserByEmail(credentials.email)
                if (!user || !user.password) {
                    return null
                }

                const isValid = await user.comparePassword(credentials.password)
                if (!isValid) {
                    return null
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    roles: user.roles ?? [Role.USER],
                }
            },
        }),
    ],

    secret: process.env.NEXTAUTH_SECRET,

    callbacks: {
        /* ------------------------------------
           Sign In
           - Creates user if missing
           - Assigns USER role only
        ------------------------------------- */
        async signIn({ user, account }) {
            if (!user.email || !user.name) return false

            try {
                await addOrUpdateUser({
                    name: user.name,
                    email: user.email,
                    image: user.image ?? undefined,
                    roles: [Role.USER],
                })

                return true
            } catch (error) {
                console.error("Sign-in error:", error)
                return false
            }
        },

        /* ------------------------------------
           JWT
           - Source of truth: database
        ------------------------------------- */
        async jwt({ token, user, trigger }) {
            if (user?.email || trigger === "update") {
                try {
                    const email = user?.email ?? token.email
                    if (!email) return token

                    const existingUser = await getUserByEmail(email)
                    if (!existingUser) return token

                    token.userId = existingUser._id.toString()
                    token.roles = existingUser.roles ?? [Role.USER]
                    token.name = existingUser.name
                    token.picture = existingUser.image
                } catch (error) {
                    console.error("JWT callback error:", error)
                }
            }

            return token
        },

        /* ------------------------------------
           Session
        ------------------------------------- */
        async session({ session, token }) {
            if (token?.userId) {
                session.user.id = token.userId
                session.user.roles = token.roles ?? [Role.USER]
                session.user.name = token.name
                session.user.image = token.picture
            }

            return session
        },
    },

    pages: {
        signIn: "/signin",
        error: "/signin",
    },

    debug: process.env.NODE_ENV === "development",
})

export { handler as GET, handler as POST }
