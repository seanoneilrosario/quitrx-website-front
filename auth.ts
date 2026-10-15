import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import { authCallbacks } from "@/lib/auth/callbacks";

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret:
    process.env.AUTH_SECRET ??
    process.env.AUTH_SESSION_SECRET ??
    (process.env.NODE_ENV !== "production" ? process.env.QUITHERO_API_KEY : undefined),

  providers: [
    Google,

    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID!,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
      authorization: {
        params: {
          scope: "email",
        },
      },
    }),
  ],

  pages: {
    signIn: "/account/login",
    error: "/account/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: authCallbacks,
});
