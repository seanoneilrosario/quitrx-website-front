import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import {
  findQuitHeroCustomerByOAuth,
  linkQuitHeroCustomerOAuth,
  syncQuitHeroCustomerWithoutBlocking,
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

      // If the OAuth provider supplied an email,
      // find/create the QuitHero customer and link the OAuth account.
      if (user.email) {
        const [firstName, ...lastNameParts] = (user.name ?? "")
          .trim()
          .split(/\s+/);

        const customer =
          await syncQuitHeroCustomerWithoutBlocking({
            email: user.email,
            firstName: firstName || undefined,
            lastName:
              lastNameParts.join(" ") || undefined,
          });

        if (customer?.id && providerAccountId) {
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

    authorized({ auth: session, request }) {
      const pathname = request.nextUrl.pathname;
      const isLoginPage = pathname === "/account/login";

      if (isLoginPage) {
        return true;
      }

      const emailSession = verifySignedCustomerSession(
        request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value,
      );

      return Boolean(
        session?.user?.id ||
          session?.user?.email ||
          emailSession?.email,
      );
    },
  },
});
