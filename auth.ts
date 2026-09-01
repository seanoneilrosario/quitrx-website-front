import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
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

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret:
    process.env.AUTH_SECRET ??
    process.env.AUTH_SESSION_SECRET ??
    (process.env.NODE_ENV !== "production"
      ? process.env.QUITHERO_API_KEY
      : undefined),

  providers: [
    Credentials({
      id: "staff-credentials",
      name: "QuitHero staff",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = stringValue(credentials.email);
        const password = stringValue(credentials.password);
        if (!email || !password) return null;

        const apiBase = (process.env.QUITHERO_API_BASE_URL ?? "https://retail-api.quithero.com.au").replace(/\/$/, "");
        const response = await fetch(`${apiBase}/auth/login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
          cache: "no-store",
        });
        if (!response.ok) return null;

        const payload = objectValue(await response.json());
        const data = objectValue(payload.data);
        const staff = objectValue(payload.staff ?? payload.user ?? data.staff ?? data.user);
        const accessToken = stringValue(
          payload.accessToken ?? payload.access_token ?? payload.token ??
          data.accessToken ?? data.access_token ?? data.token,
        );
        if (!accessToken) return null;

        return {
          id: stringValue(staff.id) ?? stringValue(payload.id) ?? email,
          email: stringValue(staff.email) ?? email,
          name: stringValue(staff.name) ?? stringValue(staff.fullName) ?? email,
          staffAccessToken: accessToken,
        };
      },
    }),
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
      if (account?.provider === "staff-credentials") return true;
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

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account?.provider === "staff-credentials" && user) {
        const staff = user as typeof user & { staffAccessToken?: string };
        token.isStaff = Boolean(staff.staffAccessToken);
      }

      return token;
    },

    async session({ session, token }) {
      const userId = token.id ?? token.sub;
      if (session.user && typeof userId === "string") {
        session.user.id = userId;
        (session.user as typeof session.user & { isStaff?: boolean }).isStaff = token.isStaff === true;
      }

      return session;
    },

    authorized({ auth: session, request }) {
      const pathname = request.nextUrl.pathname;
      const isLoginPage = pathname === "/account/login" || pathname === "/dashboard/login";

      if (isLoginPage) {
        return true;
      }

      if (pathname.startsWith("/dashboard")) {
        const isStaff = Boolean(
          session?.user &&
          (session.user as typeof session.user & { isStaff?: boolean }).isStaff,
        );
        return isStaff || Response.redirect(new URL("/dashboard/login", request.nextUrl));
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
