import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import {
  findQuitHeroCustomerByOAuth,
  linkQuitHeroCustomerOAuth,
  findQuitHeroCustomerByEmail,
  syncQuitHeroCustomer,
} from "@/lib/quithero-customers";
import {
  CUSTOMER_SESSION_COOKIE,
  verifySignedCustomerSession,
} from "@/lib/customer-session";

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret:
    process.env.AUTH_SECRET ??
    process.env.AUTH_SESSION_SECRET ??
    (process.env.NODE_ENV !== "production"
      ? process.env.QUITHERO_API_KEY
      : undefined),

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

  callbacks: {
    async signIn({ user, account }) {
      if (
        !account ||
        !["google", "facebook"].includes(account.provider)
      ) {
        return false;
      }

      const provider = account.provider as "facebook" | "google";
      const providerAccountId = account.providerAccountId;

      // First, check whether this OAuth account
      // is already linked to a QuitHero customer.
      if (providerAccountId) {
        const linkedCustomer = await findQuitHeroCustomerByOAuth(
          provider,
          providerAccountId,
        );

        if (linkedCustomer?.email) {
          user.email = linkedCustomer.email;
          user.id = linkedCustomer.id;

          return true;
        }
      }

      // Create a QuitHero customer when a verified social login is new.
      if (user.email) {
        const customer = await syncQuitHeroCustomer(user);
        if (!customer?.id) return false;

        if (providerAccountId) {
          await linkQuitHeroCustomerOAuth(
            customer.id,
            provider,
            providerAccountId,
          );

          user.id = customer.id;
        }

        return true;
      }

      // Facebook authenticated successfully, but didn't provide
      // an email and this account isn't linked yet.
      // The email collection step will be handled next.
      if (provider === "facebook") {
        return true;
      }

      return false;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      const userId = token.id ?? token.sub;
      if (session.user && typeof userId === "string") {
        session.user.id = userId;
      }

      return session;
    },

    async authorized({ auth: session, request }) {
      const pathname = request.nextUrl.pathname;
      const isLoginPage = pathname === "/account/login";

      if (isLoginPage) {
        return true;
      }

      const emailSession = verifySignedCustomerSession(
        request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value,
      );
      const email = session?.user?.email ?? emailSession?.email;
      if (email) {
        try {
          if ((await findQuitHeroCustomerByEmail(email))?.id) return true;
          return Response.redirect(new URL("/account/login?error=AccountNotFound", request.nextUrl));
        } catch {
          return Response.redirect(new URL("/account/login?error=ServiceUnavailable", request.nextUrl));
        }
      }
      return Response.redirect(new URL("/account/login", request.nextUrl));
    },
  },
});
